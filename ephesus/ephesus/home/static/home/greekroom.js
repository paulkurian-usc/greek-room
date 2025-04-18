console.log("καλωσορίσατε στο ελληνικό δωμάτιο!");

// Method to get formatted Wildebeest analysis output from the backend
export async function getDataFromElementURL(element, params) {
  var URL =
    params === undefined ? element.dataset.url : element.dataset.url + params;

  const response = await fetch(URL);
  if (response.ok) {
    let data = undefined;

    data = await response.text();
    return Promise.resolve(data);
  } else {
    return Promise.reject("Unable to retrieve data.");
  }
}

// Method to post data to backend
export async function postForm(formElement) {
  const response = await fetch(formElement.action, {
    method: "POST",
    body: new FormData(formElement),
  });
  if (response.status === 201) {
    let data = undefined;
    data = await response.json();
    return Promise.resolve(data);
  } else if (response.status === 500) {
    let data = undefined;
    if (response.headers.get("content-type") === "application/json") {
      data = await response.json();
    } else {
      data = {
        detail:
          "There was an error while processing this request. Please try again.",
      };
    }
    return Promise.reject(data);
  } else if (response.status === 422) {
    // Handling Pydantic errors
    return Promise.reject({
      detail:
        "There was an error while processing this request. Please try again.",
    });
  } else {
    return Promise.reject(
      "There was an error while processing this request. Please try again.",
    );
  }
}

export async function showInfoPopup(title, message) {
  const infoPopup = document.getElementById("info-popup");
  document.querySelector('#info-popup h3[role="title"]').innerHTML = title;
  document.querySelector('#info-popup p[role="message"]').innerHTML = message;
  infoPopup.showModal();

  // "OK" button closes the dialog
  document
    .querySelector('#info-popup button[role="confirm"]')
    .addEventListener("click", () => {
      infoPopup.close();
    });
}

export async function closeInfoPopup() {
  const infoPopup = document.getElementById("info-popup");
  infoPopup.close();
}

// Method to send delete request
export async function deleteRequest(url) {
  const response = await fetch(url, {
    method: "DELETE",
  });
  if (response.status === 200) {
    let data = undefined;
    data = await response.json();
    return Promise.resolve(data);
  } else if (response.status === 500 || response.status === 403) {
    let data = undefined;
    if (response.headers.get("content-type") === "application/json") {
      data = await response.json();
    } else {
      data = {
        detail:
          "There was an error while processing this request. Please try again.",
      };
    }
    return Promise.reject(data);
  } else {
    return Promise.reject({
      detail:
        "There was an error while processing this request. Please try again.",
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const projectsListing = document.querySelector(".listing");
  const detailsPane = document.getElementById("details-pane");

  // Parent event listener for the left pane
  projectsListing.addEventListener("click", (event) => {
    // Apply onclick listener for the project links in the left pane
    const linkTarget = event.target.closest(".link");
    if (linkTarget) {
      // Set resourceId state
      const resourceId = linkTarget.dataset.resourceId;

      // Unselect any existing and highlight selected link
      Array.from(document.getElementsByClassName("link bold")).forEach((el) =>
        el.classList.remove("bold"),
      );

      // Bold selected resource link
      linkTarget.classList.add("bold");

      // Get project overview content to display on right pane
      getDataFromElementURL(linkTarget).then(
        (content) => {
          detailsPane.innerHTML = content;
        },
        (reason) => {
          detailsPane.innerHTML =
            "There was an error while fetching the project data. Try again.";
        },
      );
    }
  });

  // Handle delete popup actions
  const deletePopup = document.getElementById("deletePopup");
  const deleteCancelButton = document.querySelector(
    '#deletePopup button[role="close"]',
  );
  const deleteConfirmButton = document.querySelector(
    '#deletePopup button[role="confirm"]',
  );
  var deleteEndpoint = {};

  // Function to handle the results after DeleteProject
  function handleDeleteProjectResult(responseData) {
    document.querySelector("#deletePopup .flex").style.display = "none";
    // Show response
    document.querySelector(
      '#deletePopup p[role="notification"] > b',
    ).innerHTML = responseData.detail;
    document.querySelector(
      '#deletePopup p[role="notification"]',
    ).style.display = "";

    // Refresh page
    setTimeout(() => {
      location.replace(location.pathname);
    }, 3000);
  }

  deleteCancelButton.addEventListener("click", (event) => {
    deletePopup.close();
  });

  deleteConfirmButton.addEventListener("click", (event) => {
    if ("deleteEndpoint" in deleteEndpoint) {
      document.querySelector(
        '#deletePopup button[role="close"]',
      ).style.display = "none";
      document.querySelector(
        '#deletePopup button[role="confirm"]',
      ).style.display = "none";
      document.querySelector('#deletePopup img[role="loader"]').style.display =
        "";
      deleteRequest(deleteEndpoint.deleteEndpoint).then(
        (responseData) => {
          handleDeleteProjectResult(responseData);
        },
        (reason) => {
          handleDeleteProjectResult(reason);
        },
      );
    }
  });

  // Parent event listener for the right pane
  detailsPane.addEventListener("click", (event) => {
    // Apply onClick listener for the analysis results links in the right pane
    // Handle Wildebeest Analysis Click
    const wbLinkTarget = event.target.closest(
      'button[name="wildebeest-analysis"]',
    );
    if (wbLinkTarget) {
      // Show loader
      detailsPane.classList.add("cursor-wait");
      wbLinkTarget.classList.add("hide");
      wbLinkTarget.nextElementSibling.classList.remove("hide");

      // Get HTML Wildebeest analysis content to display on right pane
      getDataFromElementURL(wbLinkTarget).then(
        (content) => {
          detailsPane.classList.remove("cursor-wait");
          detailsPane.innerHTML = content;
        },
        (reason) => {
          detailsPane.classList.remove("cursor-wait");
          detailsPane.innerHTML =
            "There was an error while processing the request. Try again.";
        },
      );
      return;
    }

    // Handle 'Request manual analysis' button click
    const manualAnalysisButtonTarget = event.target.closest(
      'button[data-name="manual-analysis-request"]',
    );
    if (manualAnalysisButtonTarget) {
      // Show loader
      detailsPane.classList.add("cursor-wait");
      manualAnalysisButtonTarget.setAttribute("disabled", "");
      manualAnalysisButtonTarget.nextElementSibling.classList.remove("hide");

      // Call API for raising request
      getDataFromElementURL(manualAnalysisButtonTarget).then(
        (content) => {
          detailsPane.classList.remove("cursor-wait");
          manualAnalysisButtonTarget.nextElementSibling.classList.add("hide");
          manualAnalysisButtonTarget.textContent =
            "Full analysis request sent!";
        },
        (reason) => {
          detailsPane.classList.remove("cursor-wait");
          manualAnalysisButtonTarget.nextElementSibling.classList.add("hide");
          manualAnalysisButtonTarget.textContent =
            "Error sending request. Try again.";
        },
      );
      return;
    }

    // Apply onClick listener for delete button
    const deleteIcon = event.target.closest('img[role="delete-project"]');
    if (deleteIcon) {
      deleteEndpoint = { deleteEndpoint: deleteIcon.dataset.url };
      deletePopup.showModal();

      return;
    }

    // Apply onClick listener for Wildebeest download button
    const wildebeestDownloadIcon = event.target.closest(
      'img[role="wildebeest-download"]',
    );
    if (wildebeestDownloadIcon) {
      const downloadHandle = window.open(
        wildebeestDownloadIcon.dataset.url,
        "GreekRoomContext",
      );
      if (!downloadHandle) {
        // Handle download error
        showInfoPopup(
          "Wildebeest Download Error",
          "There was an error while attempting to download the Wildebeest analysis report. Please try again.",
        );
      } else {
        // noop if download was successful
      }
      return;
    }

    // Event listener for create reference form submission
    const createReferenceForm = event.target.closest(
      "#createReferencePopup form",
    );
    const createReferenceFormSubmit = event.target.closest(
      "#createReferencePopup form input[type='submit']",
    );
    if (createReferenceFormSubmit) {
      event.preventDefault();
      document.querySelector(
        "#createReferencePopup input.create",
      ).style.display = "none";
      document.querySelector("#createReferencePopup img.create").style.display =
        "";
      // Get the selected project Resource ID
      const resourceId = document.querySelector(
        "#details-pane h2[data-resource-id]",
      ).dataset.resourceId;
      postForm(createReferenceForm).then(
        (responseData) => {
          handleCreateReferenceFormResult(responseData, resourceId);
        },
        (reason) => {
          handleCreateReferenceFormResult(reason, resourceId);
        },
      );
    }
  });

  // Function to handle the results after 'createReference'
  function handleCreateReferenceFormResult(responseData, resourceId) {
    document.querySelector("img.create").style.display = "none";
    // Show response
    document.querySelector("#reference-form-notification > b").innerHTML =
      responseData.detail;
    document.querySelector("#reference-form-notification").style.display = "";
    // Simulate project name click for partial refresh
    setTimeout(() => {
      document
        .querySelector(
          `div.content div.listing button.link[data-resource-id="${resourceId}"]`,
        )
        .click();
    }, 4000);
  }

  // Function to handle the results after CreateProject
  function handleCreateProjectFormResult(responseData) {
    document.querySelector("img.create").style.display = "none";
    // Show response
    document.querySelector("#create-form-notification > b").innerHTML =
      responseData.detail;
    document.querySelector("#create-form-notification").style.display = "";
    // Refresh page
    setTimeout(() => {
      location.replace(location.pathname);
    }, 4000);
  }

  // Event listener for create project form submission
  document
    .querySelector("#createPopup form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      // Show loader
      document.querySelector("input.create").style.display = "none";
      document.querySelector("img.create").style.display = "";
      // Post form
      postForm(event.target).then(
        (responseData) => {
          handleCreateProjectFormResult(responseData);
        },
        (reason) => {
          handleCreateProjectFormResult(reason);
        },
      );
    });

  // Function to handle the results after help
  function handleHelpFormResult(responseData) {
    document.querySelector("img.help").style.display = "none";
    // Show response
    document.querySelector("#help-form-notification > b").innerHTML =
      responseData.detail;
    console.log(responseData);
    document.querySelector("#help-form-notification").style.display = "";
    // Refresh page
    setTimeout(() => {
      location.replace(location.pathname);
    }, 5000);
  }

  // Event listener for Help form submission
  document
    .querySelector("#helpPopup form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      // Show loader
      document.querySelector("input.help").style.display = "none";
      document.querySelector("img.help").style.display = "";
      // Post form
      postForm(event.target).then(
        (responseData) => {
          handleHelpFormResult(responseData);
        },
        (reason) => {
          handleHelpFormResult(reason);
        },
      );
    });
});
