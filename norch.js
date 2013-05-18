 

exports.indexDoc = function(docID, doc, reverseIndex) {
   //use key if found, if no key is found set filename to be key.
    tfidf = new TfIdf();
    var fieldBatch = [];
    var id = docID;
//DOCS
//work out the vector for the uploaded file in the URL request
    tfidf.addDocument(doc.body, docID);

    //doc is the collection of vectors + fields for each document
    var docVectors = [];
    docVectors.push(tfidf);
    docVectors.push({'fields':doc});
    //generate reverse index for file
    //FORMAT:
    //<keyword>~CONTENT~SEEVALUE~<docID>
    for (var i = 0; i < tfidf.documents.length; i++) {
      for (var k in tfidf.documents[i]) {
        if (k != '__key') {
          var tokenKey = k + '~CONTENT~' + id;
          tfidf.documents[i]['__keyword'] = k;
          fieldBatch.push({type:'put', key:tokenKey, value:JSON.stringify(docVectors)});
        }
      }
    }
  //FIELDS
  //work out the vector for each field in the URL request.
//    for (var URLParamKey in req.body) {
    for (fieldKey in doc) {
      tfidf.addDocument(doc[fieldKey], id + '~' + fieldKey);  
      for (var k in tfidf.documents[tfidf.documents.length - 1]) {
        if (k != '__key') {
          var tokenKey = k + '~' + fieldKey + '~' + id;
          tfidf.documents[i]['__keyword'] = k;
          fieldBatch.push({type:'put', key:tokenKey, value:JSON.stringify(docVectors)});
        }
      } 
    }
debugger;

//put key-values into database
    reverseIndex.batch(fieldBatch, function (err) {
      if (err) return console.log('Ooops!', err);
      return;
    });
  }

