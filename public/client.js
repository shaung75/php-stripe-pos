var terminal = StripeTerminal.create({
  onFetchConnectionToken: fetchConnectionToken,
  onUnexpectedReaderDisconnect: unexpectedDisconnect,
});

discoverReaderHandler();


function unexpectedDisconnect() {
  // In this function, your app should notify the user that the reader disconnected.
  // You can also include a way to attempt to reconnect to a reader.
  console.log("Disconnected from reader")
}

function fetchConnectionToken() {
  // Do not cache or hardcode the ConnectionToken. The SDK manages the ConnectionToken's lifecycle.
  return fetch('/api/connection_token', { method: "POST" })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      return data.secret;
    });
}

// Handler for a "Discover readers" button
function discoverReaderHandler() {
  var config = {simulated: true};
  terminal.discoverReaders(config).then(function(discoverResult) {
    if (discoverResult.error) {
      console.log('Failed to discover: ', discoverResult.error);
    } else if (discoverResult.discoveredReaders.length === 0) {
        console.log('No available readers.');
    } else {
        discoveredReaders = discoverResult.discoveredReaders;

        // Auto connect to reader
        connectReaderHandler(discoveredReaders);
    }
  });
}

// Handler for a "Connect Reader" button
function connectReaderHandler(discoveredReaders) {
  // Just select the first reader here.
  var selectedReader = discoveredReaders[0];
  terminal.connectReader(selectedReader).then(function(connectResult) {
    if (connectResult.error) {
      console.log('Failed to connect: ', connectResult.error);
    } else {
        console.log('Connected to reader: ', connectResult.reader.label);
        
        document.getElementById("connection-status").classList.remove('connection-pending');
        document.getElementById("connection-status").classList.remove('connection-disconnected');
        document.getElementById("connection-status").classList.add('connection-connected');
    }
  });
}

function fetchPaymentIntentClientSecret(amount) {
  const bodyContent = JSON.stringify({ amount: amount });
  return fetch('/api/create_payment_intent', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: bodyContent
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    return data.client_secret;
  });
}

function collectPayment(amount) {
  fetchPaymentIntentClientSecret(amount).then(function(client_secret) {
      terminal.setSimulatorConfiguration({testCardNumber: '4242424242424242'});
      //terminal.setSimulatorConfiguration({testCardNumber: '4000000000009995'});
      terminal.collectPaymentMethod(client_secret).then(function(result) {
      if (result.error) {
        console.log("error");
      } else {
          terminal.processPayment(result.paymentIntent).then(function(result) {
          if (result.error) {
            console.log(result.error)
            document.getElementById("result-alert").classList.add('alert-danger');
            var resultAlert = document.getElementById("result-alert");
            var text = document.createTextNode(result.error.message);
            resultAlert.appendChild(text);
          } else if (result.paymentIntent) {
            paymentIntentId = result.paymentIntent.id;
            document.getElementById("result-alert").classList.add('alert-success');
            var resultAlert = document.getElementById("result-alert");
            var text = document.createTextNode("Success");
            resultAlert.appendChild(text);
          }
        });
      }
    });
  });
}

function capture(paymentIntentId) {
  return fetch('/api/capture_payment_intent', {
    method: "POST",
    headers: {
        'Content-Type': 'application/json'
    },
      body: JSON.stringify({"payment_intent_id": paymentIntentId})
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    
  });
}

var discoveredReaders;
var paymentIntentId;

const collectButton = document.getElementById('collect-button');
collectButton.addEventListener('click', async (event) => {
  amount = document.getElementById("amount-input").value * 100;
  collectPayment(amount);
});

function stringLengthOfInt(number) {
  return number.toString().length;
}

function padSpaces(lineNumber, fixedWidth) {
  // Always indent by 2 and then maybe more, based on the width of the line
  // number.
  return " ".repeat(2 + fixedWidth - stringLengthOfInt(lineNumber));
}

function formatJson(message){
  var lines = message.split('\n');
  var json = "";
  var lineNumberFixedWidth = stringLengthOfInt(lines.length);
  for(var i = 1; i <= lines.length; i += 1){
    line = i + padSpaces(i, lineNumberFixedWidth) + lines[i-1];
    json = json + line + '\n';
  }
  return json
}
