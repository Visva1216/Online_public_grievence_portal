const http = require('http');

const login = JSON.stringify({ email: 'admin@delhi.gov.in', password: 'Password@123' });
console.log('Logging in...');
const req = http.request('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': login.length }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const data = JSON.parse(body);
    const token = data.data.token;
    
    const complaintData = JSON.stringify({
      title: 'This is a valid title',
      description: 'This is a long test description which is more than 10 chars',
      category: 'SANITATION',
      latitude: 28.0,
      longitude: 77.0
    });
    
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const postData = '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="data"' + '\r\n' +
      'Content-Type: application/json' + '\r\n\r\n' +
      complaintData + '\r\n' +
      '--' + boundary + '--\r\n';
      
    const req2 = http.request('http://localhost:8080/api/complaints', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res2) => {
      let b2 = '';
      res2.on('data', d => b2 += d);
      res2.on('end', () => console.log('Submit HTTP Code:', res2.statusCode, '\nResponse:', b2));
    });
    req2.write(postData);
    req2.end();
  });
});
req.write(login);
req.end();
