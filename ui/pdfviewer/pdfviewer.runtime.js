/* global TW, pdfjsLib */
$("body").append('<script type="text/javascript" src="../Common/extensions/PDFWidget/ui/pdfviewer/jslibrary/pdf.js"></script>');
pdfjsLib.GlobalWorkerOptions.workerSrc = '../Common/extensions/PDFWidget/ui/pdfviewer/jslibrary/pdf.worker.js';

TW.Runtime.Widgets.pdfviewer = function () {
  var thisWidget = this;
  var uid = new Date().getTime() + "_" + Math.floor(1000 * Math.random());
  var standardZooms = [10, 25, 50, 75, 100, 125, 150, 200, 400];

  var currentPDF;
  var pages = [];
  var canvases = [];
  var contexts = [];
  var viewports = [];
  var loadedPages = 0;
  var renderedPages = 0;
  var heights = [0];
  var scale = 0;
  var fit = "width";
  var loading;
  var viewport1;
  var priorityPage = 1;
  var newRendering = new Date().getTime() + "_" + Math.floor(1000 * Math.random());
  var oldScrollTop, oldHeight, oldScale;

  var pageToken = TW.Runtime.convertLocalizableString("[[PDFWidget.pdfviewer.page]]", "Page");
  var fitPageToken = TW.Runtime.convertLocalizableString("[[PDFWidget.pdfviewer.fitpage]]", "Fit Page");
  var fitWidthToken = TW.Runtime.convertLocalizableString("[[PDFWidget.pdfviewer.fitwidth]]", "Fit Width");
  var errorToken = TW.Runtime.convertLocalizableString("[[PDFWidget.pdfviewer.error]]", "The file is not available or is not a valid PDF document");

  this.runtimeProperties = function () {
    return {
      'supportsAutoResize': true,
      'needsDataLoadingAndError': false
    };
  };

  this.renderHtml = function () {
    var html = '';
    html =
            '<div class="widget-content widget-pdfviewer widget-pdfviewer-' + uid + '">' +
            '  <div class="widget-pdfviewer-page">' +
            '    <button class="widget-pdfviewer-page_num widget-pdfviewer-page_num-' + uid + '">' + pageToken + ':</button>' +
            '    <select class="widget-pdfviewer-page_select widget-pdfviewer-page_select-' + uid + '"></select>' +
            '    <select class="widget-pdfviewer-outline_select widget-pdfviewer-outline_select-' + uid + '"></select>' +
            '    <button class="widget-pdfviewer-page_loading widget-pdfviewer-page_loading-' + uid + '"></button>' +
            '    <button class="widget-pdfviewer-page_fitpage widget-pdfviewer-page_fitpage-' + uid + '">' + fitPageToken + '</button>' +
            '    <button class="widget-pdfviewer-page_fitwidth widget-pdfviewer-page_fitwidth-' + uid + '">' + fitWidthToken + '</button>' +
            '    <button class="widget-pdfviewer-page_plus widget-pdfviewer-page_plus-' + uid + '">+</button>' +
            '    <select class="widget-pdfviewer-page_zoom widget-pdfviewer-page_zoom-' + uid + '"></select>' +
            '    <button class="widget-pdfviewer-page_minus widget-pdfviewer-page_minus-' + uid + '">-</button>' +
            '  </div>' +
            '  <div class="widget-pdfviewer-container widget-pdfviewer-container-' + uid + '"></div>' +
            '  <div class="widget-pdfviewer-loading widget-pdfviewer-loading-' + uid + '">' +
            '    <span class="widget-pdfviewer-loading-progress widget-pdfviewer-loading-progress-' + uid + '"></span>' +
            '  </div>' +
            '</div>';
    return html;
  };

  this.afterRender = function () {
    var outlining = false;
    var showSizingButtons = thisWidget.getProperty('showSizingButtons');

    $('.widget-pdfviewer-page_zoom-' + uid).append("<option value=''></option>");
    standardZooms.forEach(function (value) {
      $('.widget-pdfviewer-page_zoom-' + uid).append("<option value='" + value + "'>" + value + "%</option>");
    });

    $('.widget-pdfviewer-page_select-' + uid).change(function () {
      if (currentPDF) {
        var page = parseInt($(this).val());
        priorityPage = page;
        $('.widget-pdfviewer-page_num-' + uid).text(pageToken + ": " + page + "/" + currentPDF.numPages);
        $('.widget-pdfviewer-container-' + uid).scrollTop(heights[page - 1] + 5);
      }
    });

    $('.widget-pdfviewer-outline_select-' + uid).change(function () {
      if (currentPDF) {
        outlining = true;
        var json = JSON.parse($(this).val());
        var shift = viewports[json.page].height - json.Y * viewports[json.page].scale;

        priorityPage = json.page;
        $('.widget-pdfviewer-page_num-' + uid).text(pageToken + ": " + json.page + "/" + currentPDF.numPages);
        $('.widget-pdfviewer-container-' + uid).scrollTop(heights[json.page - 1] + 5 + shift);
      }
    });

    $('.widget-pdfviewer-page_fitpage-' + uid).click(function () {
      if (currentPDF) {
        fitPDF("page");
      }
    }).css("display", showSizingButtons ? "inherit" : "none");

    $('.widget-pdfviewer-page_fitwidth-' + uid).click(function () {
      if (currentPDF) {
        fitPDF("width");
      }
    }).css("display", showSizingButtons ? "inherit" : "none");

    $('.widget-pdfviewer-page_plus-' + uid).click(function () {
      if (currentPDF) {
        fitPDF("+");
      }
    }).css("display", showSizingButtons ? "inherit" : "none");

    $('.widget-pdfviewer-page_minus-' + uid).click(function () {
      if (currentPDF) {
        fitPDF("-");
      }
    }).css("display", showSizingButtons ? "inherit" : "none");

    $('.widget-pdfviewer-page_zoom-' + uid).change(function () {
      var val = $(this).val();
      if (currentPDF && val) {
        fitPDF(val);
      }
      $(this).val("");
    }).css("display", showSizingButtons ? "inherit" : "none");

    $('.widget-pdfviewer-container-' + uid).height("calc(100% - 50px)").scroll(function () {
      var page = 1;
      var scrollTop = $('.widget-pdfviewer-container-' + uid).scrollTop();
      while (heights[page] < scrollTop) {
        page++;
      }
      priorityPage = page;
      $('.widget-pdfviewer-page_num-' + uid).text(pageToken + ": " + page + "/" + currentPDF.numPages);
      $('.widget-pdfviewer-page_select-' + uid).val(page);

      if (!outlining) {
        $('.widget-pdfviewer-outline_select-' + uid + " option").each(function () {
          var json = JSON.parse($(this).val());
          var shift = viewports[json.page].height - json.Y * viewports[json.page].scale;

          if (scrollTop > heights[json.page - 1] + 5 + shift) {
            $('.widget-pdfviewer-outline_select-' + uid).val($(this).val());
          }
        });
      }
      outlining = false;
    });
  };

  this.resize = function (width, height) {
  };

  this.serviceInvoked = function (serviceName) {
    if (serviceName === 'Load') {
      $('.widget-pdfviewer-container-' + uid).empty().scrollTop(0);
      $('.widget-pdfviewer-page_num-' + uid).text(pageToken + ": ");
      $('.widget-pdfviewer-page_select-' + uid).empty();
      $('.widget-pdfviewer-outline_select-' + uid).empty();

      currentPDF = undefined;
      pages = [];
      canvases = [];
      contexts = [];
      viewports = [];
      loadedPages = 0;
      renderedPages = 0;
      heights = [0];
      scale = 0;
      fit = "width";
      loading = true;
      viewport1 = undefined;
      priorityPage = 1;

      var url = thisWidget.getProperty('url');
      var debugMode = thisWidget.getProperty('debugMode');

      var loadingTask = pdfjsLib.getDocument(url);
      loadingTask.onProgress = function (progress) {
        if (debugMode) {
          console.log("PDFViewer - loading -> " + progress.loaded + "/" + progress.total);
        }

        $('.widget-pdfviewer-page_loading-' + uid).text((progress.loaded / (1024 * 1024)).toFixed(2) + " MB");
      };
      loadingTask.promise.then(function (pdf) {
        $('.widget-pdfviewer-page_loading-' + uid).text("");

        for (var index = 1; index <= pdf.numPages; index++) {
          canvases[index] = document.createElement("canvas");
          $('.widget-pdfviewer-container-' + uid)[0].appendChild(canvases[index]);
          contexts[index] = canvases[index].getContext('2d');

          $('.widget-pdfviewer-page_select-' + uid).append("<option value='" + index + "'>" + index + "</option>");

          pdf.getPage(index).then(function (page) {
            pages[page.pageNumber] = page;
            loadedPages++;

            if (page.pageNumber === 1) {
              var viewport = page.getViewport({scale: 1});
              viewport1 = {
                width: viewport.width,
                height: viewport.height
              };
            }

            if (loadedPages === pdf.numPages) {
              newRendering = new Date().getTime() + "_" + Math.floor(1000 * Math.random());
              currentPDF = pdf;

              currentPDF.getOutline().then(outline => {
                if (outline) {
                  for (var i = 0; i < outline.length; i++) {
                    createBookmark(outline[i], "");
                  }
                  $('.widget-pdfviewer-outline_select-' + uid).css("visibility", "visible");
                } else {
                  $('.widget-pdfviewer-outline_select-' + uid).css("visibility", "hidden");
                }
              });

              renderPDF();
            }
          });
        }
      }, function (error) {
        $('.widget-pdfviewer-container-' + uid).append("<h3 style='text-align:center;padding:100px;color:whitesmoke'>" + errorToken + "</h3>");
        $('.widget-pdfviewer-page_loading-' + uid).text("");
        thisWidget.jqElement.triggerHandler("Failed");
      });
    }
  };

  function createBookmark(bookmark, indent) {
    if (typeof bookmark.dest === "string") {
      currentPDF.getDestination(bookmark.dest).then(dest => {
        createBookmark_getPageIndex(bookmark, dest, indent);
      });
    } else {
      createBookmark_getPageIndex(bookmark, bookmark.dest, indent);
    }
  }

  function createBookmark_getPageIndex(bookmark, dest, indent) {
    currentPDF.getPageIndex(dest[0]).then(pageIndex => {

      var value = {page: parseInt(pageIndex) + 1};
      switch (dest[1].name) {
        case "FitH":
          value.Y = dest[2];
          break;
        case "XYZ":
          value.Y = dest[3];
          break;
        default:
          value.Y = -1;
          break;
      }

      $('.widget-pdfviewer-outline_select-' + uid).append("<option value='" + JSON.stringify(value) + "'>" + indent + bookmark.title + "</option>");

      for (var i = 0; i < bookmark.items.length; i++) {
        createBookmark(bookmark.items[i], indent + "&nbsp;&nbsp;&nbsp;");
      }
    });
  }

  function renderPDF() {
    switch (fit) {
      case "page":
        var w = $('.widget-pdfviewer-container-' + uid).width() - 30;
        var h = $('.widget-pdfviewer-container-' + uid).height();
        scale = Math.min(w / viewport1.width, h / viewport1.height);
        break;
      case "width":
        scale = ($('.widget-pdfviewer-container-' + uid).width() - 30) / viewport1.width;
        break;
      case "+":
        scale = oldScale * 1.5;
        break;
      case "-":
        scale = oldScale / 1.5;
        break;
      default:
        scale = parseFloat(fit) / 100;
        break;
    }

    for (var index = 1; index <= currentPDF.numPages; index++) {
      viewports[index] = pages[index].getViewport({scale: scale});
      canvases[index].height = viewports[index].height;
      canvases[index].width = viewports[index].width;
      heights[index] = heights[index - 1] + canvases[index].height;
    }

    if (!loading) {
      var height = $('.widget-pdfviewer-container-' + uid)[0].scrollHeight;
      $('.widget-pdfviewer-container-' + uid).scrollTop(oldScrollTop / oldHeight * height);
    }

    var currentRendering = newRendering;
    pages[priorityPage].render({
      canvasContext: contexts[priorityPage],
      viewport: viewports[priorityPage]
    }).promise.then(function () {
      $('.widget-pdfviewer-page_fitpage-' + uid).prop("disabled", false);
      $('.widget-pdfviewer-page_fitwidth-' + uid).prop("disabled", false);
      $('.widget-pdfviewer-page_plus-' + uid).prop("disabled", false);
      $('.widget-pdfviewer-page_minus-' + uid).prop("disabled", false);

      if (currentRendering === newRendering) {
        renderedPage();
        renderPage(priorityPage - 1, -1, currentRendering);
        renderPage(priorityPage + 1, +1, currentRendering);
      }
    });
  }

  function renderPage(index, inc, currentRendering) {
    if (currentRendering === newRendering && 1 <= index && index <= currentPDF.numPages) {
      pages[index].render({
        canvasContext: contexts[index],
        viewport: viewports[index]
      }).promise.then(function () {
        if (currentRendering === newRendering) {
          renderedPage();
          renderPage(index + inc, inc, currentRendering);
        }
      });
    }
  }

  function renderedPage() {
    renderedPages++;

    var w = $('.widget-pdfviewer-loading-' + uid).width();
    w *= renderedPages / currentPDF.numPages;
    $('.widget-pdfviewer-loading-progress-' + uid).width(w);
    $('.widget-pdfviewer-loading-progress-' + uid).text(renderedPages);

    if (renderedPages === currentPDF.numPages) {
      $('.widget-pdfviewer-loading-progress-' + uid).width(0);
      $('.widget-pdfviewer-loading-progress-' + uid).text("");

      if (loading) {
        $('.widget-pdfviewer-page_num-' + uid).text(pageToken + ": 1/" + currentPDF.numPages);
        thisWidget.jqElement.triggerHandler("Loaded");
      }
      loading = false;
    }
  }

  this.updateProperty = function (updatePropertyInfo) {
    if (updatePropertyInfo.TargetProperty === 'url') {
      this.setProperty("url", updatePropertyInfo.RawSinglePropertyValue);
    } else if (updatePropertyInfo.TargetProperty === 'showSizingButtons') {
      this.setProperty("showSizingButtons", updatePropertyInfo.RawSinglePropertyValue);
    }
  };

  function fitPDF(_fit) {
    $('.widget-pdfviewer-page_fitpage-' + uid).prop("disabled", true);
    $('.widget-pdfviewer-page_fitwidth-' + uid).prop("disabled", true);
    $('.widget-pdfviewer-page_plus-' + uid).prop("disabled", true);
    $('.widget-pdfviewer-page_minus-' + uid).prop("disabled", true);

    newRendering = new Date().getTime() + "_" + Math.floor(1000 * Math.random());

    oldScrollTop = $('.widget-pdfviewer-container-' + uid).scrollTop();
    oldHeight = $('.widget-pdfviewer-container-' + uid)[0].scrollHeight;
    oldScale = scale;

    renderedPages = 0;
    heights = [0];
    scale = 0;
    fit = _fit;

    renderPDF();
  }
};