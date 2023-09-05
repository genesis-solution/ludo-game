
const webPlaySocket = (ws, req) => {
  console.log("client connected")
  try {
    // ws.clients(client=>{
    //   client.send(JSON.stringify({name:"maqsood"}));
    // })
    setInterval(() => {
      
      ws.send(JSON.stringify({ value: Math.random() }));
    }, 5000);
    // ws.clients.forEach(client => {
    //   client.send(JSON.stringify({name:"maqsood"}));
    // });
    ws.on("message", async function () {
      
      ws.send(JSON.stringify({ result: 1, data: {name:"maqsood"} }));
    });
  } catch (error) {
    
    ws.send(JSON.stringify({ result: 2, error: "forbidden" }));
  }
};

module.exports = { webPlaySocket };
