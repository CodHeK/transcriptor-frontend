import React from 'react';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader'

const Home = () => {
    const getUploadParams = async ({ file, meta }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', 'english');
      const token = localStorage.getItem('token');
      return { 
          url: `${process.env.REACT_APP_API_HOST}/api/speech/upload`, 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
      }
    }
  
    const handleChangeStatus = ({ meta }, status) => {
      console.log(status, meta)
    }
  
    const handleSubmit = (files, allFiles) => {
      console.log(files.map(f => f.meta))
      allFiles.forEach(f => f.remove())
    }
  
    return (
      <Dropzone
        getUploadParams={getUploadParams}
        onChangeStatus={handleChangeStatus}
        onSubmit={handleSubmit}
        accept="image/*,audio/*,video/*"
        inputContent={(_, extra) => (extra.reject ? 'Image, audio and video files only' : 'Upload audio file(s) to continue')}
        styles={{
          dropzoneReject: { borderColor: 'red', backgroundColor: '#DAA' },
          inputLabel: (_, extra) => (extra.reject ? { color: 'red' } : {}),
        }}
      />
    )
}

export default Home;