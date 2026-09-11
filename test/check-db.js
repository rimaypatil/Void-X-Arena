const net = require('net');

function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve({ port, open: true });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, open: false, error: 'timeout' });
    });
    socket.on('error', (err) => {
      resolve({ port, open: false, error: err.message });
    });
    socket.connect(port, host);
  });
}

async function run() {
  const ports = [5432, 5433, 5434, 3000, 3306, 27017];
  console.log('Scanning common local database ports...');
  for (const p of ports) {
    const res = await checkPort(p);
    console.log(`Port ${p}: ${res.open ? 'OPEN' : 'CLOSED (' + res.error + ')'}`);
  }
}

run();
