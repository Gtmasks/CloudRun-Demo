const axios = require('axios');
const express = require('express');
const app = express();

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

// Message Producer
// Receive an Event Message From Cloud Storage
// app.post('/api/event/storage/create', (req, res) => {
app.get('/api/event/storage/create', (req, res) => {
  // bucket_name = req.body.resource.labels.bucket_name;
  // if (bucket_name != 'run-config')
  // {
    // console.log(`skip the bucket: ${bucket_name}`);
    // res.send(`skip the bucket.`);
  // }
  // resource_name = req.body.protoPayload.resourceName;
  // resource_file = resource_name.split('/').pop()
  // console.log(`resource name: ${resource_name}`);
  // console.log(`resource file: ${resource_file}`);
  
  const bucket_name = 'run-config';
  const resource_file = 'ssh.sh';
  
  const bucket = storage.bucket(bucket_name);
  const file = bucket.file(resource_file);
  
  //-
  // If the callback is omitted, we'll return a Promise.
  //-
  file.download().then(function(data) {
    const content = data[0];
    console.log(`file content: ${content}`);
    
    sendMessage(content.toString());
  });
  
  res.send(`success!`);
});

// Message consumer
app.post('/api/event/storage/message', (req, res) => {
  console.log(`Message consumer`);
  const content = req.body.content.toString();
  uploadObject('test/test-upload-file.txt', content);
  res.send(`success!`);
});

function sendMessage(content) {
  const options = {
    headers: {'Content-Type': 'application/json'}
  };
  const messageConsumerUrl = process.env.MESSAGE_CONSUMER_URL;
  axios.post(messageConsumerUrl + '/api/event/storage/message', {
    content: content
  }, options);
}

function uploadObject(fileName, content) {
  const bucket = storage.bucket('run-config');
  const file = bucket.file(fileName);
  
  file.save(content, function(err) {
    if (!err) {
      // File written successfully.
      console.log(`upload file: ${err}`);
    }
  });
}

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`helloworld: listening on port ${port}`);
});
