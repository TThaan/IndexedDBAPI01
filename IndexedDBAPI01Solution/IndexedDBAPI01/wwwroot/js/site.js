﻿// source
// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Client-side_storage

// Create needed constants
const list = document.querySelector('ul');
const titleInput = document.querySelector('#title');
const bodyInput = document.querySelector('#body');
const form = document.querySelector('form');
const submitBtn = document.querySelector('form button');

// Create an instance of a db object for us to store the open database in
let db;


// You'll write code inside this window.onload event handler function, 
// called when the window's load event fires,
// to make sure you don't try to use IndexedDB functionality
// before the app has completely finished loading
// (it could fail if you don't).
window.onload = function () {
    // Open the database;
    // it is created if it doesn't already exist
    // (see onupgradeneeded below)
    let request = window.indexedDB.open('notes_db', 1);
    /* This line creates a request to open version 1 of a database called notes_db. 
     * If this doesn't already exist, it will be created for you by subsequent code. 
     * You will see this request pattern used very often throughout IndexedDB. 
     * Database operations take time, so they are asynchronous. 
     * You get notified when they're done.
     * Use event handlers to run code when the request completes, fails, etc.*/
    
    //#region Add event handlers to the db-request

    // onerror handler signifies that the database didn't open successfully
    request.onerror = function () {
        console.log('Database failed to open');
    };

    // onsuccess handler signifies that the database opened successfully
    request.onsuccess = function () {
        console.log('Database opened successfully');

        // Store the opened database object in the db variable.
        db = request.result;

        // Run the displayData() function to display the notes already in the IDB
        displayData();
    };

    // This handler runs if the database has not already been set up,
    // or if the database is opened with a bigger version number
    // than the existing stored database (when performing an upgrade).
    request.onupgradeneeded = function (e) {
        // Grab a reference to the opened database
        let db = e.target.result;

        //#region (This is where to define the schema (structure) of our database.)

        // Create an objectStore inside your opened database called notes_os
        // to store your notes in (equivalent to a single table in a conventional db).
        // Include an auto-incrementing key field called 'id'.
        let objectStore = db.createObjectStore('notes_os', { keyPath: 'id', autoIncrement: true });

        // Create two other indexes (fields).
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('body', 'body', { unique: false });

        //#endregion

        console.log('Database setup complete');
    };

    //#endregion

    //#region Add data to the IDB when the form is submitted.

    // Create an onsubmit handler running 'addData()' when the form is submitted.
    form.onsubmit = addData;

    // Define the addData() function
    function addData(e)
    {
        e.preventDefault();

        let newItem = { title: titleInput.value, body: bodyInput.value };
        // open a read/write db transaction, ready for adding the data
        let transaction = db.transaction(['notes_os'], 'readwrite');
        // call an object store that's already been added to the database
        let objectStore = transaction.objectStore('notes_os');

        // Make a request to add our newItem object to the object store
        // (Dont't confuse it with the former request to open/create the IDB!)
        let request = objectStore.add(newItem);
        // Add an onsuccess event handler to the current request
        request.onsuccess = function ()
        {
            // Clear the form
            titleInput.value = '';
            bodyInput.value = '';
        };

        // Report on the success of the transaction
        transaction.oncomplete = function () {
            console.log('Transaction completed: database modification finished.');

            // update the display of data 
            displayData();
        };

        transaction.onerror = function () {
            console.log('Transaction not opened due to error');
        };
    }

    //#endregion

    //#region Define the displayData() function

    function displayData()
    {
        // Delete old list elements
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }

        // open object store
        let objectStore = db.transaction('notes_os').objectStore('notes_os');

        objectStore.openCursor().onsuccess = function (e)
        {
            // and get a cursor, which iterates through the data items in the store
            let cursor = e.target.result;

            // If there is still another data item to iterate through..
            if (cursor)
            {
                // .. create an li, h3 and p to put each data item inside
                const listItem = document.createElement('li');
                const h3 = document.createElement('h3');
                const para = document.createElement('p');

                // and append them to the list
                listItem.appendChild(h3);
                listItem.appendChild(para);
                list.appendChild(listItem);

                // then put the data from the cursor inside
                h3.textContent = cursor.value.title;
                para.textContent = cursor.value.body;

                // Store the ID of the data item inside an attribute on the listItem, so we know
                // which item it corresponds to. This will be useful later when we want to delete items
                listItem.setAttribute('data-note-id', cursor.value.id);

                // Create a button and place it inside each listItem
                const deleteBtn = document.createElement('button');
                listItem.appendChild(deleteBtn);
                deleteBtn.textContent = 'Delete';

                // Set an onclick event handler for the delete button
                deleteBtn.onclick = deleteItem;

                // Iterate to the next item in the cursor
                cursor.continue();
            } else
            {
                // If the <ul> is empty.. 
                if (!list.firstChild)
                {
                    // display a 'No notes stored' message
                    const listItem = document.createElement('li');
                    listItem.textContent = 'No notes stored.';
                    list.appendChild(listItem);
                }
                // if there are no more cursor items to iterate through, say so
                console.log('Notes all displayed');
            }
        };
    }

    //#endregion

    //#region Define the deleteItem() function

    // 'e' is the delete button and e.target.parentNode 
    // is the list item (li) containing the button.
    function deleteItem(e)
    {
        // get the id of the list element
        let noteId = Number(e.target.parentNode.getAttribute('data-note-id'));

        // open a database transaction and delete the list element
        let transaction = db.transaction(['notes_os'], 'readwrite');
        let objectStore = transaction.objectStore('notes_os');
        let request = objectStore.delete(noteId);

        // report that the data item has been deleted
        transaction.oncomplete = function ()
        {
            // delete the list item, so it is no longer displayed
            e.target.parentNode.parentNode.removeChild(e.target.parentNode);
            console.log('Note ' + noteId + ' deleted.');

            // If the <ul> is empty.. 
            if (!list.firstChild)
            {
                // display a 'No notes stored' message
                let listItem = document.createElement('li');
                listItem.textContent = 'No notes stored.';
                list.appendChild(listItem);
            }
        };
    }

    //#endregion
};