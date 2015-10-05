$(function() {


    //only initiate mfd if there is more than one file present
    if (multipleFiles == "true") {
        initDownload();
    }

    $('#txtPath').tooltip();

    //check if nodelock is true and confirm container is present
    if (isNodelocked == "true") {
        nodeLockSuccess(false);
        $('.authhidden').hide();
        $('#forward-container').hide();
        //remove all links so MFD does not find them
        if (canDownload == "true") {
            href = $('.filename-size a');
            placeholder = $('<span />').insertBefore(href);
            arr = [];
            for (var i = 0; i < href.length; i++) {
                arr.push(href[i]);
            }
            href.detach();
        }



    } else {
        nodeLockSuccess(true);
    }
    $('#accept').on('click', function() {
        getNodeLock();
        closeCopyright();
    });
});


function loadVideo(fileIndex) {
    jwplayer().playlistItem(fileIndex);
}

//get window url
var rootURL = window.location.href;
if (rootURL.substr(-1) == '/')
    rootURL = rootURL.substr(0, url.length - 2);
rootURL = rootURL.split('/');
rootURL.pop();


function getNodeLock() {
    var nodelockURL = rootURL.join('/') + '/doNodelock';
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: nodelockURL,
        dataType: "text",
        success: function(data, textStatus, jqXHR) {
            nodeLockSuccess(true);
        }
    });
}

$('#dload-audioVideo .filename').css('cursor', 'pointer');
$('#dload-audioVideo .filename').click(function(e) {
    var target = e.target;
    // if (target.parentNode.tagName != 'A' && target.tagName != 'A') {
    if ((target.className == 'filename-txt') || (target.className == 'filename-type') || (target.className == 'filename-size') || (target == this)) {
        loadVideo($(this).index());
        e.stopPropagation();
    }
});

function nodeLockSuccess(success) {
    if (success) {
        $('#forward-container').show();

        //reinsert file links only if previously detached
        if (canDownload == "true") {
            if ($('.filename-size a').length == 0) {
                var elem = $('.filename-size');
                for (var i = 0; i < elem.length; i++) {
                    var link = arr.shift();
                    elem[i].insertBefore(link, placeholder.nextSibling);
                    placeholder.remove();
                }
            }
        }

        $('.authhidden').show();
        $('.authhidden').removeClass('authhidden');
        $('.playerSidebarImage').remove();


        //attach downloader API
        mfd.attach(function(result) {
            downloader = result.downloader;
            browser = result.browser;
            if ($('.filename a').length > 1) {
                if (result.status == 'OK') {
                    $('.multiple').show();
                } else if (result.status == 'AVAILABLE') {
                    $('.multiple').hide();
                    $('#downloadStore').append('<p>' + downloadStore + '<a target="_blank" href="' + result.addonUrl + '">' + mDownloader + '.</a></p>');
                } else {
                    $('#downloadAllBtn').show();
                }
            }
        });
    }
}

//forward click event
$('#forward-button').click(function(event) {
    var forwardURL = rootURL.join('/') + '/forwardpackage';
    var txtValue = document.getElementById('txtforwardPackage').value;
    if (validateEmail(txtValue)) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: forwardURL + '/' + txtValue,
            dataType: "text",
            success: function(data, textStatus, jqXHR) {
                fadeBoxColor(true);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                fadeBoxColor(false);
            }
        });
    } else {
        fadeBoxColor(false);
    }
});


function fadeBoxColor(success) {
    if (success) {
        document.getElementById('txtforwardPackage').value = "";
        $('#txtforwardPackage').css('background-color', '#B5E8BF').animate({
            backgroundColor: 'white'
        }, {
            duration: 2000
        });
        $('#txtforwardPackage').focus();
    } else {
        $('#txtforwardPackage').css('background-color', '#FFCCCC').animate({
            backgroundColor: 'white'
        }, {
            duration: 2000
        });
        $('#txtforwardPackage').focus();
    }
}

function validateEmail(field) {
    if (field == "") {
        fadeBoxColor(false);
        return false;
    }

    if (field.search("&gt;") != -1) {
        var tail = field.replace(/.*\&gt;/gi, '');
        if (tail.replace(" ", "") != "") {
            fadeBoxColor(false);
            return false;
        }
    }
    field = field.replace(/.*\&lt;|\&gt;/gi, '');
    var regex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i;
    return (regex.test(field)) ? true : false;
}

function initDownload() {
    //Initialize click events
    $('a#downloadMultiple').on('click', function() {
        showMultiple();
        checkAll();
    });

    $('a#downloadCancel').on('click', function() {
        cancelMultiple();
    });

    $('#btnDownload').on('click', function() {
        var path = localStorage["path"];
        downloader.initiate($('a.active'), path);
        cancelMultiple();

    });

    //initialize path folder edit box
    var txtPath = document.getElementById("txtPath");
    txtPath.addEventListener("input", checkPath);

    //initialize button that allows changing/restoring the path
    var btnChange = document.getElementById("txtPath");

    $(".hidden").click(function() {
        if (downloader && browser == 'Safari') {
            downloader.selectFolder(function(path) {
                txtPath.value = path;
            });
        } else {
            $(this).hide().prev("input[disabled]").prop("disabled", false).focus();
            txtPath.value = '';
        }
    });

    $('#txtPath').blur(function() {
        $(this).prop("disabled", true);
        if (!path) {
            txtPath.value = 'Destination';
        } else {
            txtPath.value = $('#txtPath').val();
        }
        $('.hidden').show();
    });


    //get previously used path, if any
    path = localStorage["path"];
    if (!path) {
        //no path stored so just use downloads folder
        txtPath.value = 'Destination';
        txtPath.disabled = true;
        txtPath.setAttribute("class", "hideBox");
    } else {
        //use previous path
        txtPath.value = path;
        txtPath.disabled = false;
        txtPath.setAttribute("class", "");
    }

    //initialize select/unselect checkbox
    var chkAll = document.getElementById("chkAll");
    var chkNone = document.getElementById("chkNone");

    //add download class to initial checked box
    $('.selectFiles').each(function() {
        if ($(this).is(':checked')) {
            $(this).siblings('.filename-size').find('a').addClass('active');
        }
    })


    $('#checkDownload').click(function() {
        if (this.checked) {
            checkAll();
        } else {
            checkNone();
        }
    });

    //add download class to all or none checkboxes
    function checkAll() {
        $(".selectFiles").each(function() {
            this.checked = true;
            $(this).siblings('.filename-size').find('a').addClass('active');
        });
    }

    function checkNone() {
        $(".selectFiles").each(function() {
            this.checked = false;
            $(this).siblings('.filename-size').find('a').removeClass('active');
        });
    }

    //add class to href of selected input
    $(".selectFiles").change(function() {
        if (this.checked) {
            $(this).siblings('.filename-size').find('a').addClass('active');
        } else {
            $(this).siblings('.filename-size').find('a').removeClass('active');
        }
    });
}

function cancelMultiple() {
    $('#downloadContainer').fadeOut();
    $('.selectFiles').hide();
    $('.downloadBg').removeClass('greybg');
    $('.arrow').show();
    setTimeout(function() {
        $('.multiple').css('visibility', 'visible');
    }, 100);

}

function showMultiple() {
    $('#downloadContainer').fadeIn();
    $('#checkDownload').prop('checked', true);
    $('.selectFiles').show();
    $('.arrow').hide();
    $('.downloadBg').addClass('greybg');
    $('.multiple').css('visibility', 'hidden');
}


function checkPath() {
    //validate paths
    var v = txtPath.value;
    if (/(^(\s|\\|\/|\.)|[<>:"|?*]|((\\|\/|\.)(\\|\/|\.))|(\s|\\|\/)$)/.test(v)) {
        txtPath.style.color = "#f00";
    } else {
        txtPath.style.color = "#000";
        localStorage["path"] = txtPath.value;
    }
}

function changePath() {
    if (txtPath.disabled) {
        //Dont change button text value for Safari
        if (browser !== 'Safari') {
            btnChange.textContent = useDefault;
            txtPath.disabled = false;
        }
        //enable custom folder editing

        if (browser == 'Safari') {
            if (path) {
                txtPath.value = path;
            } else {
                txtPath.value = useDefault;
            }
        } else {
            if (path) {
                txtPath.value = path;
            } else {
                txtPath.value = "";
            }
        }
    } else {
        //use default downloads folder
        txtPath.value = useDefault;
        txtPath.disabled = true;
        localStorage.removeItem("path");

    }
}
