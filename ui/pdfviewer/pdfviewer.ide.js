/* global TW */
TW.IDE.Widgets.pdfviewer = function () {
  this.widgetIconUrl = function () {
    return '../Common/extensions/PDFViewerWidget/ui/pdfviewer/pdf.png';
  };

  this.widgetProperties = function () {
    return {
      'name': 'PDFViewer',
      'description': 'Widget to show a (very basic) PDF viewer',
      'category': ['Common'],
      'iconImage': 'pdf.png',
      'supportsAutoResize': true,
      'properties': {
        'Width': {
          'description': 'width',
          'defaultValue': 200
        },
        'Height': {
          'description': 'height',
          'defaultValue': 28
        },
        'url': {
          'baseType': 'STRING',
          'isBindingTarget': true,
          description: "The URL to retrieve the PDF"
        },
        'debugMode': {
          'isVisible': true,
          'baseType': 'BOOLEAN',
          'isEditable': true,
          'defaultValue': false,
          'description': 'true to activate the debug'
        },
        'showSizingButtons': {
          'isVisible': true,
          'baseType': 'BOOLEAN',
          'isEditable': true,
          'defaultValue': true,
          'description': 'true to display the resizing buttons'
        }
      }
    };
  };

  this.renderHtml = function () {
    return '<div class="widget-content widget-pdfviewer">' + '<span class="pdfviewer-property">PDF Viewer</span>' + '</div>';
  };

  this.widgetServices = function () {
    return {
      'Load': {}
    };
  };

  this.widgetEvents = function () {
    return {
      'Loaded': {},
      'Failed': {}
    };
  };
};