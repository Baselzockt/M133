var date = new Date();
var errorId = 0;
var weekDays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

$(document).ready(setup);

//Start Defining functions for the Date Object
Date.prototype.getWeek = function() {
    //getting the weeks since the first day of the year
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7) - 1;
}

Date.prototype.addWeek = function() {
    //sets the date to a week later
    this.setDate(this.getDate() + 7);
}

Date.prototype.substractWeek = function() {
    //sets the date to a week prior
    this.setDate(this.getDate() - 7);
}

const myDatePicker = MCDatepicker.create({
    el: '#week',
    selectedDate: new Date()
})

myDatePicker.onSelect((dt) => {
    date = new Date(Date.parse(dt));
    if (date == "Invalid Date") {
        date = new Date();
    }
    updateTable();
});

//End Defining functions for the Date Object

//Setups varios html related things
function setup() {
    //show the calendar week and year
    $("#week").text((date.getWeek() < 10 ? "0" + date.getWeek() : date.getWeek()) + "-" + date.getFullYear());
    //hide elements which should not be visible
    $("#timeTableContainer").hide();
    $("#noClassesAvailableAlert").hide();
    $("#classesNotLoadedAlert").hide();
    $("#weekSelector").hide();
    $("#jobsNotLoadedAlert").hide();
    $("#classes").hide();
    //load all jobs from the api and populate the selection box
    loadAllJobs();
}

//Loads All Jobs and selects a job if a job id is saved in local storage
function loadAllJobs() {
    //load all jobs
    $.getJSON("https//sandbox.gibm.ch/berufe.php").done(data => {
        //check if there is data
        if (data.length > 0) {
            //hide alert. The request was successfull
            $("#jobsNotLoadedAlert").hide();
            //append job options for the returned data
            appendJobOptions(data);
            //check if there is alredy a JobId stored in localstorage and if there is set the selected job
            checkLocalStorageForJobID();
            //prepare classes dropdown
            prepareClasses();
        }
    }).fail(function() {
        $("#jobsNotLoadedAlert").fadeIn();
    });
}

function appendJobOptions(data) {
    $("#jobs").append(new Option("Bitte Beruf Wählen", 0))
    $.each(data, function(_key, value) {
        $("#jobs").append(new Option(value.beruf_name, value.beruf_id));
    });
}

function checkLocalStorageForJobID() {
    //Looking if job id is saved in local storage
    if (localStorage.getItem("job") != null) {
        $("#jobs").val(localStorage.getItem("job"));
    }
}

function prepareClasses() {
    $("#classes").fadeIn();
    //tryes to load classes for the selected job. shows a message when none is selected
    loadClasses($("#jobs").find(":selected").val());
}

function updateTable() {
    $("#week").text((date.getWeek() < 10 ? "0" + date.getWeek() : date.getWeek()) + "-" + date.getFullYear());
    loadTimeTable($("#classes").find(":selected").val());
}

$("#back").on("click", e => {
    e.preventDefault();
    date.substractWeek();
    updateTable();
});

$("#forward").on("click", e => {
    e.preventDefault();
    date.addWeek();
    updateTable();
});

$("#jobs").on("change", () => {
    //Load all classes
    $("#timeTableContainer").fadeOut(function() {
        $("#timeTableContainer").hide();
        $("#timeTable").hide();
        $("#weekSelector").fadeOut();
        localStorage.clear();
        localStorage.setItem("job", $("#jobs").find(":selected").val());
        loadClasses($("#jobs").find(":selected").val());
    });
});

$("#classes").on("change", () => {
    //Load all lessions
    $("#timeTable").hide();
    $("#weekSelector").fadeIn();
    $("#timeTableContainer").fadeIn();
    date = new Date();
    localStorage.setItem("class", $("#classes").find(":selected").val());
    updateTable();
});

function loadClasses(jobId) {
    //hide alerts and remove options from the dropdown
    $("#noClassesAvailableAlert").hide();
    $("#classesNotLoadedAlert").hide();
    $("#classes").find('option')
        .remove()
        .end()
        //getting the data from the endpoint
    getClasses(jobId);
}

function getClasses(jobId) {
    $.getJSON("https//sandbox.gibm.ch/klassen.php?beruf_id=" + jobId,
        data => {
            if (data.length > 0) {
                //data was found populating class selector
                appendClassOptions(data);
                //checking if a class id is saved in Local storage and if so load timtable of the class
                checkLocalStorageForClassID();
            } else {
                //no class was found showing message
                $("#classes").hide();
                $("#noClassesAvailableAlert").fadeIn();
            }
        }
    ).fail(() => {
        $("#noClassesAvailableAlert").hide();
        $("#classesNotLoadedAlert").fadeIn();
    });
}

function appendClassOptions(data) {
    //apending default selection
    $("#classes").append(new Option("Bitte Klasse Wählen", 0));
    //start appending options
    $.each(data, function(_key, value) {
        //appending a new option based on the class name and id
        $("#classes").append(new Option(value.klasse_name, value.klasse_id));
    });
    //showing the dropdown selector
    $("#classes").fadeIn();
}

function checkLocalStorageForClassID() {
    //check if a class is available
    if (localStorage.getItem("class") != null) {
        //loading class id from localStorage
        var classId = localStorage.getItem("class")
            //setting selector value
        $("#classes").val(classId);
        //showing week selector
        $("#weekSelector").fadeIn();
        //showing time table container
        $("#timeTableContainer").fadeIn();
        //loading time table
        loadTimeTable(classId);
    }
}

function loadTimeTable(classId) {
    // checking if time table is visible and if it is fade it out for the reloading of the data
    if ($("#timeTable").is(":visible")) {
        $("#timeTable").fadeOut(function() {
            doTimeTableLoad(classId);
        });
    } else {
        doTimeTableLoad(classId)
    }
}

function doTimeTableLoad(classId) {
    //hide elements just in case
    $("#timeTable").hide();
    //removing rows
    $("#timeTableBody").children().remove();
    //check if a class was selected (id 0 means none is selected)
    if (classId != 0) {
        //hiding alert
        $("#timeTableAlert").hide();
        //getting time table
        getTimeTable(classId)
    } else {
        //removing timetable container
        $("#timeTableContainer").fadeOut();
    }
}

function getTimeTable(classId) {
    //loading time table from api
    $.getJSON("https//sandbox.gibm.ch/tafel.php?klasse_id=" + classId + "&woche=" + date.getWeek() + "-" + date.getFullYear(),
        function(data) {
            //checking if we got data
            if (data.length > 0) {
                //data was returned build the time table
                appendTimeTable(data)
            } else {
                //no data was returned show message
                $("#timeTableAlert").fadeIn();
            }
        }
    );
}

function appendTimeTable(data) {
    //append each row
    $.each(data, function(_key, value) {
        //apending the row
        $("#timeTableBody").append("<tr><th>" + value.tafel_datum + "</th><th>" + weekDays[value.tafel_wochentag - 1] +
            "</th><th>" + value.tafel_von + "</th><th>" + value.tafel_bis + "</th><th>" + value.tafel_lehrer + "</th><th>" + value.tafel_longfach +
            "</th><th>" + value.tafel_raum + "</th></tr>");
    });
    //show the time table
    $("#timeTable").fadeIn();
}
