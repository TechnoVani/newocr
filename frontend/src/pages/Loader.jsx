// src/components/Loader.jsx
import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

function Loader() {
  return (
    <div className="flex justify-center mt-10">
      <CircularProgress />
    </div>
  );
}

export default Loader;