async function test() {
  try {
    const res = await fetch('http://localhost:3000/');
    console.log('Homepage status:', res.status, res.statusText);
    const html = await res.text();
    const footerIdx = html.indexOf('data-testid="public-footer"');
    console.log('Footer snippet:\n', html.substring(footerIdx, footerIdx + 1200));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
test();
