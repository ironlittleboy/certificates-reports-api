export function getCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = ("0" + (today.getMonth() + 1)).slice(-2); // Meses de 2 dígitos
  const day = ("0" + today.getDate()).slice(-2); // Días de 2 dígitos
  return `${year}-${month}-${day}`;
}