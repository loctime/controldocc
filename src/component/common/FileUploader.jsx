import React, { useState } from 'react';
import { Button, LinearProgress, Typography } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { storage } from '../../firebaseconfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function FileUploader({ onUploadComplete, folder = 'uploads' }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `${folder}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const prog = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(prog);
      },
      (error) => {
        console.error('Upload error:', error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUploading(false);
        setProgress(0);
        onUploadComplete({
          url: downloadURL,
          fileName: file.name,
          fileType: file.type
        });
      }
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Button
        variant="contained"
        component="label"
        startIcon={<UploadIcon />}
        disabled={uploading}
      >
        Subir archivo
        <input type="file" hidden onChange={handleFileChange} />
      </Button>
      {uploading && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption">{progress}% completado</Typography>
        </Box>
      )}
    </Box>
  );
}

const Box = ({ children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }} {...props}>
    {children}
  </div>
);
