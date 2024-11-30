var name = '';
var encoded = null;
var fileExt = null;

// Testing Codepipeline 2


function search() {
  var searchTerm = document.getElementById("searchbar").value;
  var apigClient = apigClientFactory.newClient({ apiKey: "dsi26xlHu41UqcoVGkCmz57U6xA39egI719YrY4c" });


    var body = { };
    var params = {q : searchTerm};
    var additionalParams = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    apigClient.searchGet(params, body , additionalParams).then(function(res){
        console.log("success");
        console.log(res);
        showImages(res.data)
      }).catch(function(result){
          console.log(result);
          console.log("NO RESULT");
      });

}

/////// SHOW IMAGES BY SEARCH //////

function showImages(res) {
  var newDiv = document.getElementById("images");
  if (newDiv) {
    while (newDiv.firstChild) {
      newDiv.removeChild(newDiv.firstChild);
    }
  }

  console.log(res);

  // Parse the JSON string in res.body
  let data;
  try {
    data = JSON.parse(res.body);
  } catch (e) {
    console.error("Error parsing JSON:", e);
    data = [];
  }

  if (data.length === 0) {
    var newContent = document.createTextNode("No image to display");
    newDiv.appendChild(newContent);
  } else {
    // Iterate over the parsed array
    for (var i = 0; i < data.length; i++) {
      var imageKey = data[i].key; // e.g., "Tree3.jpeg"
      var newimg = document.createElement("img");
      
      // Randomly assign a class name
      var classname = randomChoice(['big', 'vertical', 'horizontal', '']);
      if (classname) {
        newimg.classList.add(classname);
      }
      
      // Extract the filename
      var filename = imageKey.substring(imageKey.lastIndexOf('/') + 1);
      
      // Set the image source
      newimg.src = "https://photos-bucket-1.s3.amazonaws.com/" + filename;
      console.log("Image URL: ", newimg.src);
      
      // Append the image to the div
      newDiv.appendChild(newimg);
    }
  }
}


function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}



function toggleCustomLabelInput() {
  var customLabelsInput = document.getElementById('customLabels');
  if (customLabelsInput.style.display === 'none' || customLabelsInput.style.display === '') {
    customLabelsInput.style.display = 'block';
  } else {
    customLabelsInput.style.display = 'none';
  }
}

///// UPLOAD IMAGES ///////

const realFileBtn = document.getElementById("realfile");
function uploadImage() {
  // No need to display the custom labels input since it's already visible
  realFileBtn.click(); 
}

function previewFile(input) {
  var file = input.files[0];
  var reader = new FileReader();
  var name = file.name;
  var fileExt = name.split(".").pop().toLowerCase();
  var onlyname = name.replace(/\.[^/.]+$/, "");
  var finalName = onlyname + "." + fileExt;

  console.log("File extension:", fileExt);
  console.log("Final filename:", finalName);

  // Check if the file is an image
  if (!['jpg', 'jpeg', 'png'].includes(fileExt)) {
    alert("Please select a valid image file (JPG, JPEG, or PNG).");
    return;
  }

  var customLabels = document.getElementById('customLabels').value;

  reader.onload = function(e) {
    var apigClient = apigClientFactory.newClient({
      apiKey: "dsi26xlHu41UqcoVGkCmz57U6xA39egI719YrY4c"
    });

    var params = {
      "bucket": "photos-bucket-1",
      "filename": finalName
    };

    var additionalParams = {
      headers: {
        "Content-Type": file.type,
        "x-amz-meta-customLabels": customLabels
      }
    };
    body = btoa(e.target.result);
    apigClient.uploadBucketFilenamePut(params, body, additionalParams)
      .then(function(result) {
        console.log('Reader body : ', body);
        console.log("Upload result:", result);
        alert("Photo Uploaded Successfully");
        // Clear the custom labels input
        document.getElementById('customLabels').value = '';
      })
      .catch(function(error) {
        console.error("Upload error:", error);
        alert("Photo Upload Failed: " + error.message);
      });
  };
  reader.readAsBinaryString(file);
}