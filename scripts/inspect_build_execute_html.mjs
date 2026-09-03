async function inspect() {
  const res = await fetch('http://localhost:3000/for-entrepreneurs/build-execute');
  const html = await res.text();
  console.log('Includes /for-entrepreneurs/build-execute:', html.includes('/for-entrepreneurs/build-execute'));
  console.log('Occurrences of /for-entrepreneurs/build-execute:', (html.match(/\/for-entrepreneurs\/build-execute/g) || []).length);
  console.log('Includes Execution System:', html.includes('Execution System'));
}
inspect();
