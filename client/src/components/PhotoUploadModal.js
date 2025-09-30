import React, { useState, useRef } from 'react';
import { FiX, FiUpload, FiCamera, FiImage, FiCheck, FiAlertTriangle } from 'react-icons/fi';

function PhotoUploadModal({ isOpen, onClose, onFileSelect, title = "Upload Photo" }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreview(null);
    setDragOver(false);
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div 
            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragOver ? '#f0f8ff' : '#fafafa',
              borderColor: dragOver ? '#007bff' : '#ccc',
              transition: 'all 0.3s ease'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            {preview ? (
              <div>
                <img 
                  src={preview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px', 
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }} 
                />
                
              </div>
            ) : (
              <div>
                <FiImage size={48} style={{ color: '#6c757d', marginBottom: '16px' }} />
                <h3 style={{ marginBottom: '8px', color: '#495057' }}>
                  Drop your photo here or click to browse
                </h3>
                <p style={{ color: '#6c757d', marginBottom: '16px' }}>
                  Supports JPG, PNG, GIF formats
                </p>
                <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '16px' }}>
                  📸 Upload your photo
                </p>
                <button 
                  type="button"
                  className="pill"
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <FiUpload style={{ marginRight: '8px' }} />
                  Choose File
                </button>
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px', 
            marginTop: '20px' 
          }}>
            <button 
              type="button"
              className="pill"
              onClick={handleClose}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            {preview && (
              <button 
                type="button"
                className="pill"
                onClick={handleConfirm}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Confirm Upload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoUploadModal;
