import * as ImagePicker from 'expo-image-picker';

export async function pickImage() {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error(
      'Photo library permission is required to add product images.'
    );
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      selectionLimit: 1,
    });

  if (
    result.canceled ||
    !result.assets?.length
  ) {
    return null;
  }

  return result.assets[0];
}

export async function takePhoto() {
  const permission =
    await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error(
      'Camera permission is required to take a product photo.'
    );
  }

  const result =
    await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

  if (
    result.canceled ||
    !result.assets?.length
  ) {
    return null;
  }

  return result.assets[0];
}