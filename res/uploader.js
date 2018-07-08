/*!
 * Uploader v0.1.1
 * https://github.com/fengyuanchen/uploader
 *
 * Copyright (c) 2014-2016 Fengyuan Chen
 * Released under the MIT license
 *
 * Date: 2016-07-13T06:41:02.002Z
 */

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as anonymous module.
    define('uploader', ['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node / CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals.
    factory(jQuery);
  }
})(function ($) {

  'use strict';

  var FormData = window.FormData;
  var NAMESPACE = 'uploader';
  var EVENT_CHANGE = 'change.' + NAMESPACE;
  var EVENT_DRAG_OVER = 'dragover.' + NAMESPACE;
  var EVENT_DROP = 'drop.' + NAMESPACE;
  var EVENT_UPLOAD = 'upload.' + NAMESPACE;
  var EVENT_START = 'start.' + NAMESPACE;
  var EVENT_PROGRESS = 'progress.' + NAMESPACE;
  var EVENT_DONE = 'done.' + NAMESPACE;
  var EVENT_FAIL = 'fail.' + NAMESPACE;
  var EVENT_END = 'end.' + NAMESPACE;
  var EVENT_UPLOADED = 'uploaded.' + NAMESPACE;

  function Uploader(element, options) {
    this.$element = $(element);
    this.options = $.extend(true, {}, Uploader.DEFAULTS, $.isPlainObject(options) && options);
    this.disabled = false;
    this.sync = false;
    this.queues = 0;
    this.init();
  }

  Uploader.prototype = {
    constructor: Uploader,

    init: function () {
      var options = this.options;
      var $this = this.$element;

      if (!options.name) {
        options.name = $this.attr('name') || 'file';
      }

      if (options.dropzone) {
        this.$dropzone = $(options.dropzone);
      }

      if (!FormData) {
        this.sync = true;
        this.$clone = $this.clone();
      }

      this.bind();
    },

    bind: function () {
      var options = this.options;
      var $this = this.$element;

      if ($.isFunction(options.upload)) {
        $this.on(EVENT_UPLOAD, options.upload);
      }

      if ($.isFunction(options.start)) {
        $this.on(EVENT_START, options.start);
      }

      if ($.isFunction(options.progress)) {
        $this.on(EVENT_PROGRESS, options.progress);
      }

      if ($.isFunction(options.done)) {
        $this.on(EVENT_DONE, options.done);
      }

      if ($.isFunction(options.fail)) {
        $this.on(EVENT_FAIL, options.fail);
      }

      if ($.isFunction(options.end)) {
        $this.on(EVENT_END, options.end);
      }

      if ($.isFunction(options.uploaded)) {
        $this.on(EVENT_UPLOADED, options.uploaded);
      }

      $this.on(EVENT_CHANGE, $.proxy(this.change, this));

      if (options.dropzone) {
        this.$dropzone
          .on(EVENT_DRAG_OVER, $.proxy(this.dragover, this))
          .on(EVENT_DROP, $.proxy(this.drop, this));
      }
    },

    unbind: function () {
      var options = this.options;
      var $this = this.$element;

      if ($.isFunction(options.upload)) {
        $this.off(EVENT_UPLOAD, options.upload);
      }

      if ($.isFunction(options.start)) {
        $this.off(EVENT_START, options.start);
      }

      if ($.isFunction(options.progress)) {
        $this.off(EVENT_PROGRESS, options.progress);
      }

      if ($.isFunction(options.done)) {
        $this.off(EVENT_DONE, options.done);
      }

      if ($.isFunction(options.fail)) {
        $this.off(EVENT_FAIL, options.fail);
      }

      if ($.isFunction(options.end)) {
        $this.off(EVENT_END, options.end);
      }

      if ($.isFunction(options.uploaded)) {
        $this.off(EVENT_UPLOADED, options.uploaded);
      }

      $this.off(EVENT_CHANGE, this.change);

      if (options.dropzone) {
        this.$dropzone
          .off(EVENT_DRAG_OVER, this.dragover)
          .off(EVENT_DROP, this.drop);
      }
    },

    change: function () {
      if (this.options.autoUpload) {
        this.upload();
      }
    },

    dragover: function (e) {
      e.preventDefault();
    },

    drop: function (e) {
      var event = e.originalEvent;

      e.preventDefault();

      if (event.dataTransfer) {
        this.upload(event.dataTransfer.files);
      }
    },

    upload: function (files) {
      var $this = this.$element;
      var uploadEvent;

      files = files || $this.prop('files');

      if (!(files && files.length) && !$this.val()) {
        return;
      }

      uploadEvent = $.Event(EVENT_UPLOAD, {
        files: files
      });

      $this.trigger(uploadEvent);

      if (uploadEvent.isDefaultPrevented()) {
        return;
      }

      if (files && files.length) {
        this.start(files);
      } else if ($this.val()) {
        this.start();
      }
    },

    start: function (files) {
      var options = this.options;
      var $this = this.$element;
      var _this = this;
      var startEvent;

      if (this.disabled) {
        return;
      }

      if (!this.sync && options.singleUpload && files && files.length) {
        this.disabled = true;
        $this.prop('disabled', false);

        $.each(files, function (i, file) {
          var startEvent = $.Event(EVENT_START, {
                index: i,
                files: [file]
              });

          $this.trigger(startEvent);

          if (startEvent.isDefaultPrevented()) {
            return;
          }

          _this.queues++;
          _this.ajaxUpload(file, i);
        });

        return;
      }

      startEvent = $.Event(EVENT_START, {
        index: 0,
        files: files
      });

      $this.trigger(startEvent);

      if (startEvent.isDefaultPrevented()) {
        return;
      }

      this.disabled = true;

      if (this.sync) {
        this.syncUpload(); // Don't disable file input when sync upload
      } else {
        $this.prop('disabled', false);
        this.ajaxUpload(files);
      }
    },

    ajaxUpload: function (file, index) {
      var options = this.options;
      var $this = this.$element;
      var data = new FormData();
      var _this = this;
      var ajaxOptions;

      if ($.isPlainObject(options.data)) {
        $.each(options.data, function (name, value) {
          data.append(name, value);
        });
      }

      // Add file in the end
      data.append(options.name, file);

      ajaxOptions = $.extend({}, options, {
        method: options.method || 'POST',
        data: data,
        processData: false,
        contentType: false,
        success: function (data, textStatus, jqXHR) {
          _this.success(data, textStatus, jqXHR, this, index);
        },
        error: function (jqXHR, textStatus, errorThrown) {
          _this.error(jqXHR, textStatus, errorThrown, this, index);
        },
        complete: function (jqXHR, textStatus) {
          _this.complete(jqXHR, textStatus, this, index);
        }
      });

      if ($.isFunction(options.progress)) {
        ajaxOptions.xhr = function () {
          var xhr = new XMLHttpRequest();

          if (xhr.upload) {
            xhr.upload.onprogress = function (e) {
              $this.trigger($.Event(EVENT_PROGRESS, {
                index: index,
                lengthComputable: e.lengthComputable,
                total: e.total,
                loaded: e.loaded
              }));
            };
          }

          return xhr;
        };
      }

      $.ajax(ajaxOptions.url, ajaxOptions);
    },

    syncUpload: function () {
      var $this = this.$element;
      var $clone = this.$clone;
      var options = this.options;
      var timestamp = (new Date()).getTime();
      var target = NAMESPACE + timestamp;
      var inputs = (function () {
            var items = [];

            if ($.isPlainObject(options.data)) {
              $.each(options.data, function (name, value) {
                items.push('<input type="hidden" name="' + name + '" value="' + value + '">');
              });
            }

            return items.join('');
          })();
      var $form = $('<form>').attr({
            method: options.method || 'POST',
            action: (function (url) {
              return (url + (url.indexOf('?') === -1 ? '?' : '&') + 'timestamp=' + timestamp);
            })(options.url), // Bust cache for IE
            enctype: 'multipart/form-data',
            target: target
          });
      var $iframe = $('<iframe>').attr({
            name: target,
            src: ''
          });
      var progressData = {
            lengthComputable: true,
            total: 100,
            loaded: 0
          };
      var completed = false;
      var progress = function () {
            if (completed) {
              progressData.loaded = 100;
            } else if (progressData.loaded < 100) {
              progressData.loaded += (100 - progressData.loaded) / 10;
              setTimeout(progress, 500);
            }

            $this.trigger($.Event(EVENT_PROGRESS, progressData));
          };
      var _this = this;

      // Ready iframe
      $iframe.one('load', function () {

        // Respond submit
        $iframe.one('load', function () {
          var message;
          var data;

          try {
            data = $(this).contents().find('body').text();

            if (_this.options.dataType === 'json') {
              data = $.parseJSON(data);
            }
          } catch (e) {
            message = e.message;
          }

          if (message) {
            _this.error(null, 'error', message, null, 0);
          } else {
            _this.success(data, 'success', null, null, 0);
          }

          completed = true;
          $form.get(0).reset(); // Reset form to clear files
          $clone.after($this).detach(); // Restore the original one and detach the clone one
          $form.empty().remove(); // Clear and remove the provisional form
          _this.complete(null, 'complete', null, 0);
        });

        // Submit form
        $this.after($clone); // Put the clone one after the original one as a placeholder
        $form.append(inputs); // Add params before file
        $form.append($this); // Move the original file input into the provisional form
        $form.one('submit', progress).submit();
      });

      // Append to document
      $form.append($iframe).hide().appendTo('body');
    },

    success: function (data, textStatus, jqXHR, jqAjaxOptions, index) {
      var options = this.options;

      if ($.isFunction(options.success)) {
        options.success.call(jqAjaxOptions, data, textStatus, jqXHR);
      }

      this.$element.trigger($.Event(EVENT_DONE, {
        index: index
      }), data, textStatus);
    },

    error: function (jqXHR, textStatus, errorThrown, jqAjaxOptions, index) {
      var options = this.options;

      if ($.isFunction(options.error)) {
        options.error.call(jqAjaxOptions, jqXHR, textStatus, errorThrown);
      }

      this.$element.trigger($.Event(EVENT_FAIL, {
        index: index
      }), textStatus, errorThrown);
    },

    complete: function (jqXHR, textStatus, jqAjaxOptions, index) {
      var options = this.options;
      var $this = this.$element;
      var completed = false;
      var complete = $.proxy(function () {
            completed = true;
            this.disabled = false;
            $this.prop('disabled', false);
            this.reset();
          }, this);

      if (!this.sync && this.queues) {
        this.queues--;

        if (!this.queues) {
          complete();
        }
      } else {
        complete();
      }

      if ($.isFunction(options.complete)) {
        options.complete.call(jqAjaxOptions, jqXHR, textStatus);
      }

      $this.trigger($.Event(EVENT_END, {
        index: index
      }), textStatus);

      if (completed) {
        $this.trigger(EVENT_UPLOADED);
      }
    },

    reset: function () {
      var $this = this.$element;
      var $clone = this.$clone;
      var $form;

      $this.val(''); // Clear file input

      if ($this.val()) { // If failed (IE8,9), clear file input with form.reset()
        $form = $('<form>'); // Create a provisional form
        $this.after($clone); // Insert the clone one after to original one
        $form.append($this).hide().appendTo('body').get(0).reset(); // Reset form to clear files
        $clone.after($this).detach(); // Restore the original one and detach the clone one
        $form.remove(); // Remove the provisional form
      }
    },

    destroy: function () {
      this.unbind();
      this.$element.removeData(NAMESPACE);
    }
  };

  Uploader.DEFAULTS = {
    // Upload name (use file input name by default)
    // Type: String
    name: '',

    // Upload url
    // Type: String
    url: '',

    // Extra parameters
    // Type: Object
    data: null,

    // Automatic upload when file input change
    // Type: Boolean
    autoUpload: true,

    // Upload multiple files one by one
    // Type: Boolean
    singleUpload: true,

    // A zone for dropping files
    // Type: String (jQuery selector)
    dropzone: '',

    // Events (shortcuts)
    // Type: Function
    upload: null,
    start: null,
    progress: null,
    done: null,
    fail: null,
    end: null,
    uploaded: null
  };

  Uploader.setDefaults = function (options) {
    $.extend(true, Uploader.DEFAULTS, options);
  };

  // Save the other uploader
  Uploader.other = $.fn.uploader;

  // Register as jQuery plugin
  $.fn.uploader = function (options) {
    var args = [].slice.call(arguments, 1);

    return this.each(function () {
      var $this = $(this);
      var data = $this.data(NAMESPACE);
      var fn;

      if (!data) {
        if (/destroy/.test(options)) {
          return;
        }

        $this.data(NAMESPACE, (data = new Uploader(this, options)));
      }

      if (typeof options === 'string' && $.isFunction(fn = data[options])) {
        fn.apply(data, args);
      }
    });
  };

  $.fn.uploader.Constructor = Uploader;
  $.fn.uploader.setDefaults = Uploader.setDefaults;

  // No conflict
  $.fn.uploader.noConflict = function () {
    $.fn.uploader = Uploader.other;
    return this;
  };

});
