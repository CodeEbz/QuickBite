import * as ImagePicker from 'expo-image-picker';
import api from './api';

const getFilename = (asset) => {
  if (asset.fileName) return asset.fileName;
  const uriName = asset.uri?.split('/').pop();
  return uriName || `quickbite-upload-${Date.now()}.jpg`;
};

const getMimeType = (asset) => {
  if (asset.mimeType) return asset.mimeType;
  const name = getFilename(asset).toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

export const pickImageFromLibrary = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Gallery permission is required to choose an image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.82,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return result.assets[0];
};

export const uploadImage = async (path, asset) => {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: getFilename(asset),
    type: getMimeType(asset),
  });

  return api.post(path, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
