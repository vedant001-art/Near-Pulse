/**
 * Reverse-geocodes latitude/longitude into human-readable address fields
 * using OpenStreetMap Nominatim (free, no API key required).
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};

    const streetParts = [
      a.house_number,
      a.road || a.pedestrian || a.footway || a.residential,
    ].filter(Boolean);

    const locality =
      a.suburb ||
      a.neighbourhood ||
      a.quarter ||
      a.hamlet ||
      a.village ||
      a.town ||
      a.city_district ||
      '';

    const city =
      a.city ||
      a.town ||
      a.municipality ||
      a.state_district ||
      a.county ||
      a.state ||
      '';

    const address =
      streetParts.join(', ') ||
      a.amenity ||
      a.building ||
      locality ||
      (data.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : '');

    const shortLabel = [locality || address, city].filter(Boolean).join(', ') ||
      (data.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : '');

    return {
      address: address || '',
      locality: locality || city || '',
      city: city || '',
      shortLabel,
      displayName: data.display_name || '',
    };
  } catch {
    return null;
  }
}

/**
 * Compresses a local image File into a JPEG base64 Data URL so it can be
 * stored directly in PostgreSQL and work both locally and when deployed.
 */
export function compressImageFile(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
