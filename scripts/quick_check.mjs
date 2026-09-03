const res = await fetch('http://localhost:3000/for-investors/diligence-invest');
console.log('Status:', res.status, res.statusText);
const text = await res.text();
console.log('Length:', text.length);
if (text.length < 500) {
  console.log('FULL RESPONSE:', text);
} else {
  console.log('First 300 chars:', text.substring(0, 300));
  const errMatch = text.match(/data-next-error-message="([^"]+)"/);
  if (errMatch) {
    console.log('ERROR:', errMatch[1]);
  } else {
    console.log('No error pattern found - page seems OK');
  }
}
