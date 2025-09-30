const express = require("express");
const { Currency } = require("../models");
const { Op } = require("sequelize");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

const router = express.Router();

// Generate currency ID
const generateCurrencyId = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `CUR-${randomNum}`;
};

// Get all currencies
router.get("/", validateToken, logViewOperation("Currency"), async (req, res) => {
  try {
    const { status, q } = req.query;
    const userSaccoId = req.user?.saccoId || 'SYSTEM';
    const whereClause = { isDeleted: 0 };
    
    // Include both user's sacco currencies and SYSTEM currencies
    if (userSaccoId) {
      whereClause[Op.or] = [
        { saccoId: userSaccoId },
        { saccoId: 'SYSTEM' }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (q) {
      whereClause[Op.or] = [
        { currencyCode: { [Op.like]: `%${q}%` } },
        { currencyName: { [Op.like]: `%${q}%` } },
        { country: { [Op.like]: `%${q}%` } }
      ];
    }

    const currencies = await Currency.findAll({
      where: whereClause,
      order: [['currencyCode', 'ASC']]
    });

    res.json({ entity: currencies });
  } catch (error) {
    console.error("Error fetching currencies:", error);
    res.status(500).json({ error: "Failed to fetch currencies" });
  }
});

// Get currency by ID
router.get("/:id", validateToken, logViewOperation("Currency"), async (req, res) => {
  try {
    const { id } = req.params;
    const saccoId = req.user?.saccoId || 'SYSTEM';
    const currency = await Currency.findOne({
      where: { id, saccoId, isDeleted: 0 }
    });

    if (!currency) {
      return res.status(404).json({ error: "Currency not found" });
    }

    res.json({ entity: currency });
  } catch (error) {
    console.error("Error fetching currency:", error);
    res.status(500).json({ error: "Failed to fetch currency" });
  }
});

// Create new currency
router.post("/", validateToken, logCreateOperation("Currency"), async (req, res) => {
  try {
    const {
      currencyCode,
      currencyName,
      symbol,
      decimalPlaces,
      exchangeRate,
      isBaseCurrency,
      country,
      region,
      description,
      status
    } = req.body;

    // Check if currency code already exists
    const existingCurrency = await Currency.findOne({
      where: { currencyCode: currencyCode.toUpperCase(), isDeleted: 0 }
    });

    if (existingCurrency) {
      return res.status(400).json({ error: "Currency code already exists" });
    }

    // If this is set as base currency, unset other base currencies
    if (isBaseCurrency) {
      await Currency.update(
        { isBaseCurrency: false },
        { where: { isBaseCurrency: true, isDeleted: 0 } }
      );
    }

    const currencyData = {
      currencyId: generateCurrencyId(),
      saccoId: req.user?.saccoId || 'SYSTEM',
      currencyCode: currencyCode.toUpperCase(),
      currencyName,
      symbol,
      decimalPlaces: decimalPlaces || 2,
      exchangeRate: exchangeRate || 1.000000,
      isBaseCurrency: isBaseCurrency || false,
      country,
      region,
      description,
      status: status || "Active",
      createdBy: req.user?.username || "System",
      createdOn: new Date(),
      modifiedBy: req.user?.username || "System",
      modifiedOn: new Date()
    };

    const newCurrency = await Currency.create(currencyData);
    res.status(201).json({ entity: newCurrency });
  } catch (error) {
    console.error("Error creating currency:", error);
    res.status(500).json({ error: "Failed to create currency" });
  }
});

// Update currency
router.put("/:id", validateToken, logUpdateOperation("Currency"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      currencyCode,
      currencyName,
      symbol,
      decimalPlaces,
      exchangeRate,
      isBaseCurrency,
      country,
      region,
      description,
      status,
      verifierRemarks
    } = req.body;

    const currency = await Currency.findOne({
      where: { id, isDeleted: 0 }
    });

    if (!currency) {
      return res.status(404).json({ error: "Currency not found" });
    }

    // Check if currency code already exists (excluding current record)
    if (currencyCode && currencyCode !== currency.currencyCode) {
      const existingCurrency = await Currency.findOne({
        where: { 
          currencyCode: currencyCode.toUpperCase(), 
          isDeleted: 0,
          id: { [Op.ne]: id }
        }
      });

      if (existingCurrency) {
        return res.status(400).json({ error: "Currency code already exists" });
      }
    }

    // If this is set as base currency, unset other base currencies
    if (isBaseCurrency && !currency.isBaseCurrency) {
      await Currency.update(
        { isBaseCurrency: false },
        { where: { isBaseCurrency: true, isDeleted: 0, id: { [Op.ne]: id } } }
      );
    }

    const updateData = {
      currencyCode: currencyCode ? currencyCode.toUpperCase() : currency.currencyCode,
      currencyName: currencyName || currency.currencyName,
      symbol: symbol !== undefined ? symbol : currency.symbol,
      decimalPlaces: decimalPlaces !== undefined ? decimalPlaces : currency.decimalPlaces,
      exchangeRate: exchangeRate !== undefined ? exchangeRate : currency.exchangeRate,
      isBaseCurrency: isBaseCurrency !== undefined ? isBaseCurrency : currency.isBaseCurrency,
      country: country !== undefined ? country : currency.country,
      region: region !== undefined ? region : currency.region,
      description: description !== undefined ? description : currency.description,
      status: status || currency.status,
      modifiedBy: req.user?.username || "System",
      modifiedOn: new Date(),
      lastUpdated: new Date()
    };

    // Add verifier remarks if provided (for status changes)
    if (verifierRemarks) {
      updateData.verifierRemarks = verifierRemarks;
    }

    await Currency.update(updateData, { where: { id } });
    
    const updatedCurrency = await Currency.findOne({ where: { id } });
    res.json({ entity: updatedCurrency });
  } catch (error) {
    console.error("Error updating currency:", error);
    res.status(500).json({ error: "Failed to update currency" });
  }
});

// Delete currency (soft delete)
router.delete("/:id", validateToken, logDeleteOperation("Currency"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const currency = await Currency.findOne({
      where: { id, isDeleted: 0 }
    });

    if (!currency) {
      return res.status(404).json({ error: "Currency not found" });
    }

    // Note: Currency usage check with Products removed as currency column was removed from Products table

    await Currency.update(
      { 
        isDeleted: 1,
        modifiedBy: req.user?.username || "System",
        modifiedOn: new Date()
      },
      { where: { id } }
    );

    res.json({ message: "Currency deleted successfully" });
  } catch (error) {
    console.error("Error deleting currency:", error);
    res.status(500).json({ error: "Failed to delete currency" });
  }
});

// Get active currencies for lookup
router.get("/lookup/active", validateToken, async (req, res) => {
  try {
    const userSaccoId = req.user?.saccoId || 'SYSTEM';
    const currencies = await Currency.findAll({
      where: { 
        [Op.or]: [
          { saccoId: userSaccoId },
          { saccoId: 'SYSTEM' }
        ],
        status: "Active", 
        isDeleted: 0 
      },
      attributes: ['id', 'currencyCode', 'currencyName', 'symbol', 'isBaseCurrency'],
      order: [['currencyCode', 'ASC']]
    });

    res.json({ entity: currencies });
  } catch (error) {
    console.error("Error fetching active currencies:", error);
    res.status(500).json({ error: "Failed to fetch active currencies" });
  }
});

module.exports = router;
