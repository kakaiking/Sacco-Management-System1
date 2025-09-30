// Lightweight image validation utility for signature validation
class ImageValidationService {
  constructor() {
    this.signatureConfidenceThreshold = 0.4;
  }


  // Analyze image for signature characteristics
  analyzeSignatureCharacteristics(imageElement) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      ctx.drawImage(imageElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let darkPixels = 0;
      let totalPixels = data.length / 4;
      let edgePixels = 0;
      let textLikePixels = 0;
      
      // Analyze each pixel
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = (r + g + b) / 3;
          
          // Count dark pixels (potential ink)
          if (brightness < 128) {
            darkPixels++;
          }
          
          // Simple edge detection for text-like structures
          if (x > 0 && y > 0 && x < canvas.width - 1 && y < canvas.height - 1) {
            const currentBrightness = brightness;
            const neighbors = [
              data[idx - 4], data[idx + 4], // left, right
              data[idx - canvas.width * 4], data[idx + canvas.width * 4] // top, bottom
            ];
            
            const avgNeighborBrightness = neighbors.reduce((sum, val) => sum + val, 0) / (neighbors.length * 3);
            
            if (Math.abs(currentBrightness - avgNeighborBrightness) > 40) {
              edgePixels++;
              
              // Check for text-like patterns (horizontal and vertical lines)
              if (this.isTextLikePattern(data, x, y, canvas.width, canvas.height)) {
                textLikePixels++;
              }
            }
          }
        }
      }
      
      const darkPixelRatio = darkPixels / totalPixels;
      const edgeDensity = edgePixels / totalPixels;
      const textLikeRatio = textLikePixels / totalPixels;
      
      // Calculate signature confidence
      const confidence = Math.min(
        (darkPixelRatio * 0.4) + 
        (edgeDensity * 0.4) + 
        (textLikeRatio * 0.2), 
        1
      );
      
      return {
        darkPixelRatio,
        edgeDensity,
        textLikeRatio,
        confidence,
        isLikelySignature: confidence > this.signatureConfidenceThreshold && 
                          darkPixelRatio > 0.05 && 
                          darkPixelRatio < 0.8
      };
    } catch (error) {
      console.error('Signature analysis error:', error);
      return {
        darkPixelRatio: 0,
        edgeDensity: 0,
        textLikeRatio: 0,
        confidence: 0,
        isLikelySignature: false,
        error: error.message
      };
    }
  }

  // Check for text-like patterns (simple heuristic)
  isTextLikePattern(data, x, y, width, height) {
    const idx = (y * width + x) * 4;
    const currentBrightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    
    // Check horizontal continuity
    let horizontalContinuity = 0;
    for (let dx = -2; dx <= 2; dx++) {
      if (x + dx >= 0 && x + dx < width) {
        const neighborIdx = (y * width + (x + dx)) * 4;
        const neighborBrightness = (data[neighborIdx] + data[neighborIdx + 1] + data[neighborIdx + 2]) / 3;
        if (Math.abs(currentBrightness - neighborBrightness) < 20) {
          horizontalContinuity++;
        }
      }
    }
    
    // Check vertical continuity
    let verticalContinuity = 0;
    for (let dy = -2; dy <= 2; dy++) {
      if (y + dy >= 0 && y + dy < height) {
        const neighborIdx = ((y + dy) * width + x) * 4;
        const neighborBrightness = (data[neighborIdx] + data[neighborIdx + 1] + data[neighborIdx + 2]) / 3;
        if (Math.abs(currentBrightness - neighborBrightness) < 20) {
          verticalContinuity++;
        }
      }
    }
    
    // Text-like patterns have good continuity in at least one direction
    return horizontalContinuity >= 3 || verticalContinuity >= 3;
  }

  // Main validation function for photos
  async validatePhoto(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          isValid: true,
          confidence: 1,
          message: '✅ Photo uploaded successfully',
          faceCount: 0
        });
      };
      img.onerror = () => resolve({
        isValid: false,
        confidence: 0,
        message: '❌ Failed to load image. Please try again.',
        faceCount: 0
      });
      img.src = URL.createObjectURL(file);
    });
  }

  // Main validation function for signatures
  async validateSignature(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Analyze signature characteristics
          const signatureResult = this.analyzeSignatureCharacteristics(img);
          
          resolve({
            isValid: signatureResult.isLikelySignature,
            confidence: signatureResult.confidence,
            message: signatureResult.isLikelySignature
              ? `✅ Valid signature detected (confidence: ${Math.round(signatureResult.confidence * 100)}%)`
              : '⚠️ Image may not be a valid signature. Please ensure you upload a clear signature.',
            faceDetected: false,
            signatureAnalysis: signatureResult
          });
        } catch (error) {
          resolve({
            isValid: false,
            confidence: 0,
            message: '❌ Error analyzing image. Please try again.',
            faceDetected: false
          });
        }
      };
      img.onerror = () => resolve({
        isValid: false,
        confidence: 0,
        message: '❌ Failed to load image. Please try again.',
        faceDetected: false
      });
      img.src = URL.createObjectURL(file);
    });
  }
}

export default new ImageValidationService();
