let db; 

// indexedDb connection to db 'budget_tracker' and set version 1
const request = indexedDB.open('budget_tracker', 1);

// fires if version changes 
request.onupgradeneeded = function(event) {
    // save db reference
    const db = event.target.result; 

    // create object store and set to auto increment
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    // when db is created with object store, save ref to db in global variable
    db = event.target.result; 

    // if online, run uploadTransaction() to send local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
}

request.onerror = function(event) {
    console.log(event.target.errorCode); 
}

// function to save record when post request is attempted and failed due to no connection
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transObjectStore = transaction.objectStore('new_transaction');

    transObjectStore.add(record); 
}

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transObjectStore = transaction.objectStore('new_transaction');

    const getAll = transObjectStore.getAll(); 

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                  Accept: "application/json, text/plain, */*",
                  "Content-Type": "application/json"
                }
              })
              .then(response => response.json())
              .then(serverResponse => {
                  if (serverResponse.message) {
                      throw new Error(serverResponse);
                  }

                // to clear items from store 
                const transaction = db.transaction(['new_transaction'], 'readwrite');

                const transObjectStore = transaction.objectStore('new_transaction');

                transObjectStore.clear(); 

                alert('All transactions have been submitted');
              })
              .catch(err => {
                  console.log(err); 
              })
        }
    }
}

// listens for app coming back online
window.addEventListener('online', uploadTransaction);