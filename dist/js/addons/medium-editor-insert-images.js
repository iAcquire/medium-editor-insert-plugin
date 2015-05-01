/*! 
 * medium-editor-insert-plugin v0.4.2 - jQuery insert plugin for MediumEditor
 *
 * https://github.com/orthes/medium-editor-insert-plugin
 * 
 * Copyright (c) 2014 Pavel Linkesch (http://linkesch.sk)
 * Released under the MIT license
 */

(function ($) {

  $.fn.mediumInsert.registerAddon('images', {

    /**
    * Images default options
    */

    defaults: {
      /**
      * Active or inactive image's drag and drop
      */
      useDragAndDrop: true,

      /**
      * Relative path to a script that handles file uploads
      */
      imagesUploadScript: 'upload.php',

      /**
      * Relative path to a script that handles file deleting
      */
      imagesDeleteScript: 'delete.php',
      
      /**
      * Placeeholder text for inserting link
      */
      urlPlaceholder: 'Paste or type a link',

      /**
      * Format data before sending them to server while uploading an image
      *
      * @param {File} file File to upload
      * @return {object} formData FormData instance
      */
      formatData: function (file) {
        var formData = new FormData();
        formData.append('file', file);
        return formData;
      },

      /**
      * Upload single file
      *
      * @param {element} $placeholder Placeholder to add image to
      * @param {File} file File to upload
      * @param {object} that Context
      * @param {void}
      */
      uploadFile: function ($placeholder, file, that) {
        $.ajax({
          type: "post",
          url: that.options.imagesUploadScript,
          xhr: function () {
            var xhr = new XMLHttpRequest();
            xhr.upload.onprogress = that.updateProgressBar;
            return xhr;
          },
          cache: false,
          contentType: false,
          complete: function (jqxhr) {
            that.uploadCompleted(jqxhr, $placeholder);
          },
          processData: false,
          data: that.options.formatData(file)
        });
      },

      /**
      * Makes ajax call for deleting a file on a server
      *
      * @param {string} file File name
      * @param {object} that Context
      * @return {void}
      */
      deleteFile: function (file, that) {
        $.ajax({
          type: "post",
          url: that.options.imagesDeleteScript,
          data: {
            file: file
          }
        });
      }
    },


    /**
    * Images initial function
    *
    * @param {object} options Options to overide defaults
    * @return {void}
    */

    init: function (options) {
      if (options && options.$el) {
        this.$el = options.$el;
      }
      this.options = $.extend(this.defaults, options);

      this.setImageEvents();

      if (this.options.useDragAndDrop === true){
        this.setDragAndDropEvents();
      }

      this.preparePreviousImages();

    },


    /**
    * Returns insert button
    *
    * @param {string} buttonLabels
    * @return {string}
    */

    insertButton: function(buttonLabels){
      var label = 'Img';
      if (buttonLabels === 'fontawesome' || typeof buttonLabels === 'object' && !!(buttonLabels.fontawesome)) {
        label = '<i class="fa fa-picture-o"></i>';
      }
      
      if (typeof buttonLabels === 'object' && buttonLabels.img) {
        label = buttonLabels.img;
      }

      return '<button data-addon="images" data-action="add" class="medium-editor-action mediumInsert-action">'+label+'</button>';
    },

    /**
    * Make existing images interactive
    *
    * @return {void}
    */

    preparePreviousImages: function () {
      this.$el.find('.mediumInsert-images').each(function() {
        var $parent = $(this).parent();
        if (!$parent.hasClass('mediumInsert-placeholder')) {
          $parent.html($.fn.mediumInsert.insert.getButtons('images') +
            '<div class="mediumInsert-placeholder" draggable="true">' + $parent.html() + '</div>'
          );
        }
      });
    },

    /**
    * Add image to placeholder
    *
    * @param {element} $placeholder Placeholder to add image to
    * @return {element} $selectFile <input type="file"> element
    */

    add: function ($placeholder) {
      var that = this,
          $selectFile, files;

      $selectFile = $('<input type="file" multiple="multiple">').click();
      $selectFile.change(function () {
        files = this.files;
        that.uploadFiles($placeholder, files, that);
      });

      $.fn.mediumInsert.insert.deselect();

      return $selectFile;
    },

    /**
    * Update progressbar while upload
    *
    * @param {event} e XMLHttpRequest.upload.onprogress event
    * @return {void}
    */

    updateProgressBar: function (e) {
      var $progress = $('.progress:first', this.$el),
          complete;

      if (e.lengthComputable) {
        complete = e.loaded / e.total * 100;
        complete = complete ? complete : 0;
        $progress.attr('value', complete);
        $progress.html(complete);
      }
    },

    /**
    * Show uploaded image after upload completed
    *
    * @param {jqXHR} jqxhr jqXHR object
    * @return {void}
    */

    uploadCompleted: function (jqxhr, $placeholder) {
      var $progress = $('.progress:first', $placeholder),
          $img;

      $progress.attr('value', 100);
      $progress.html(100);

      if (jqxhr.responseText) {
        $progress.before('<figure class="mediumInsert-images"><img src="'+ jqxhr.responseText +'" draggable="true" alt=""></figure>');
        $img = $progress.siblings('img');

        $img.load(function () {
          $img.parent().mouseleave().mouseenter();
        });
      } else {
        $progress.before('<div class="mediumInsert-error">There was a problem uploading the file.</div>');

        setTimeout(function () {
          $('.mediumInsert-error:first', $placeholder).fadeOut(function () {
            $(this).remove();
          });
        }, 3000);
      }

      $progress.remove();

      $placeholder.closest('[data-medium-element]').trigger('keyup').trigger('input');
    },

    /**
    * Upload single file
    *
    * @param {element} $placeholder Placeholder to add image to
    * @param {File} file File to upload
    * @param {object} that Context
    * @param {void}
    */

    uploadFile: function ($placeholder, file, that) {
      return that.options.uploadFile($placeholder, file, that);
    },

    /**
    * Lopp though files, check file types and call uploadFile() function on each file that passes
    *
    * @param {element} placeholder Placeholder to add image to
    * @param {FileList} files Files to upload
    * @param {object} that Context
    * @return {void}
    */

    uploadFiles: function ($placeholder, files, that) {
      var acceptedTypes = {
        'image/png': true,
        'image/jpeg': true,
        'image/gif': true
      };

      for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if (acceptedTypes[file.type] === true) {
          $placeholder.append('<progress class="progress" min="0" max="100" value="0">0</progress>');

          that.uploadFile($placeholder, file, that);
        }
      }
    },

    /**
    * Makes ajax call for deleting a file on a server
    *
    * @param {string} file File name
    * @param {object} that Context
    * @return {void}
    */

    deleteFile: function (file, that) {
      return that.options.deleteFile(file, that);
    },

    /**
    * Set image events displaying remove and resize buttons
    *
    * @return {void}
    */

    setImageEvents: function () {
      var that = this;

      this.$el.on('mouseenter', '.mediumInsert-images', function () {
        var $img = $('img', this),
            positionTop,
            positionLeft;

        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }

        if ($img.length > 0) {
          $(this).append('<a class="mediumInsert-imageIcon mediumInsert-imageRemove"></a>');

          if ($(this).prevAll().length === 0) {
            if ($(this).parent().parent().hasClass('small')) {
              $(this).append('<a class="mediumInsert-imageIcon mediumInsert-imageResizeBigger"></a>');
            } else {
              $(this).append('<a class="mediumInsert-imageIcon mediumInsert-imageResizeSmaller"></a>');
            }
          }
          
          if ($(this).siblings().length === 0) {  
            if ($img.parent().is('a')) {
              $(this).append('<a class="mediumInsert-imageIcon mediumInsert-imageUnlink"></a>');
            } else {
              $(this).append('<a class="mediumInsert-imageIcon mediumInsert-imageLink"></a>');
            }
          }
          
          positionTop = $img.position().top + parseInt($img.css('margin-top'), 10);
          positionLeft = $img.position().left + $img.width() -30;
          $('.mediumInsert-imageRemove', this).css({
            'right': 'auto',
            'top': positionTop,
            'left': positionLeft
          });
          $('.mediumInsert-imageResizeBigger, .mediumInsert-imageResizeSmaller', this).css({
            'right': 'auto',
            'top': positionTop,
            'left': positionLeft-31
          });
          $('.mediumInsert-imageLink, .mediumInsert-imageUnlink', this).css({
            'right': 'auto',
            'top': positionTop,
            'left': positionLeft-62
          });
        }
      });

      this.$el.on('mouseleave', '.mediumInsert-images', function () {
        $('.mediumInsert-imageIcon', this).remove();
      });

      this.$el.on('click', '.mediumInsert-imageResizeSmaller', function () {
        $(this).parent().parent().parent().addClass('small');
        $(this).parent().mouseleave().mouseleave();

        $.fn.mediumInsert.insert.deselect();
        that.$el.trigger('keyup').trigger('input');
      });

      this.$el.on('click', '.mediumInsert-imageResizeBigger', function () {
        $(this).parent().parent().parent().removeClass('small');
        $(this).parent().mouseleave().mouseleave();

        $.fn.mediumInsert.insert.deselect();
        that.$el.trigger('keyup').trigger('input');
      });

      this.$el.on('click', '.mediumInsert-imageRemove', function () {
        var img = $(this).siblings('img').attr('src');

        if ($(this).parent().siblings().length === 0) {
          $(this).parent().parent().parent().removeClass('small');
        }
        $(this).parent().remove();

        that.deleteFile(img, that);

        $.fn.mediumInsert.insert.deselect();

        that.$el.trigger('keyup').trigger('input');
      });
      
      this.$el.on('click', '.mediumInsert-imageLink', function () {
        var $placeholder = $(this).closest('.mediumInsert-placeholder'),
            $formHtml = $('<div class="medium-editor-toolbar medium-editor-toolbar-active medium-editor-toolbar-form-anchor mediumInsert-imageLinkWire" style="display: block;"><input type="text" value="" placeholder="' + that.options.urlPlaceholder + '" class="mediumInsert-imageLinkText medium-editor-toolbar-anchor-input"/><a href="#" class="medium-editor-toobar-anchor-save">&#10003;</a><a href="#" class="medium-editor-toobar-anchor-close">&times;</a></div>');
        
        $formHtml.appendTo($placeholder);
        setTimeout(function () {
          $formHtml.find('input').focus();
        }, 50);

        $.fn.mediumInsert.insert.deselect();
      });
      
      this.$el.on('click', '.mediumInsert-imageUnlink', function () {
        var $figure = $(this).closest('.mediumInsert-images');

        $figure.find('img').unwrap();
        
        $(this).removeClass('mediumInsert-imageUnlink')
          .addClass('mediumInsert-imageLink');
          
        that.$el.trigger('keyup').trigger('input');
      });
      
      this.$el
        .on('keypress', '.mediumInsert-imageLinkText', function (e) {
          var $placeholder = $(this).closest('.mediumInsert-placeholder');

          if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
            $placeholder.find('.mediumInsert-images:first').find('img').wrap('<a href="'+ $(this).val() +'" target="_blank"></a>');            
            $placeholder.find('.mediumInsert-imageLink')
              .removeClass('mediumInsert-imageLink')
              .addClass('mediumInsert-imageUnlink');
            
            // Workaround for "Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is no longer a child of this node. Perhaps it was moved in a 'blur' event handler?"
            try {  
              $('.mediumInsert-imageLinkWire').remove();
            } catch(err) {}
            
            that.$el.trigger('keyup').trigger('input');
          }
        })
        .on('blur', '.mediumInsert-imageLinkText', function () {
            setTimeout(function(){
              $('.mediumInsert-imageLinkWire').remove();
            }, 250);
        })
        .on('paste', '.mediumInsert-imageLinkText', function (e) {
          if ($.fn.mediumInsert.insert.isFirefox && e.originalEvent.clipboardData) {
            $(this).val(e.originalEvent.clipboardData.getData('text/plain'));
          }
        });
      this.$el.on('click', '.medium-editor-toobar-anchor-save', function(){
        var $placeholder = $(this).closest('.mediumInsert-placeholder');

        $placeholder.find('.mediumInsert-images:first').find('img').wrap('<a href="' + $('input.mediumInsert-imageLinkText').val() + '" target="_blank"></a>');
        $placeholder.find('.mediumInsert-imageLink')
            .removeClass('mediumInsert-imageLink')
            .addClass('mediumInsert-imageUnlink');

        // Workaround for "Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is no longer a child of this node. Perhaps it was moved in a 'blur' event handler?"
        try {
          $('.mediumInsert-imageLinkWire').remove();
        } catch (err) {
        }

        that.$el.trigger('keyup').trigger('input');
      });
      this.$el.on('click', '.medium-editor-toobar-anchor-close', function(){
        $('.mediumInsert-imageLinkWire').remove();
      });
    },

    /**
    * Set drag and drop events
    *
    * @return {void}
    */

    setDragAndDropEvents: function () {
      var that = this,
          dropSuccessful = false,
          dropSort = false,
          dropSortIndex, dropSortParent;

      $(document).on('dragover', 'body', function () {
        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }

        that.$el.addClass('hover');
      });

      $(document).on('dragend', 'body', function () {
        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }

        that.$el.removeClass('hover');
      });

      this.$el.on('dragover', '.mediumInsert', function () {
        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }

        $(this).addClass('hover');
        $(this).attr('contenteditable', true);
      });

      this.$el.on('dragleave', '.mediumInsert', function () {
        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }

        $(this).removeClass('hover');
        $(this).attr('contenteditable', false);
      });

      this.$el.on('dragstart', '.mediumInsert .mediumInsert-images img', function () {
        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }

        dropSortIndex = $(this).parent().index();
        dropSortParent = $(this).parent().parent().parent().attr('id');
      });

      this.$el.on('dragend', '.mediumInsert .mediumInsert-images img', function (e) {
        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }

        if (dropSuccessful === true) {
          if ($(e.originalEvent.target.parentNode).siblings().length === 0) {
            $(e.originalEvent.target.parentNode).parent().parent().removeClass('small');
          }
          $(e.originalEvent.target.parentNode).mouseleave();
          $(e.originalEvent.target.parentNode).remove();
          dropSuccessful = false;
          dropSort = false;

          that.$el.trigger('keyup').trigger('input');
        }
      });

      this.$el.on('dragover', '.mediumInsert .mediumInsert-images img', function (e) {
        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }

        e.preventDefault();
      });

      this.$el.on('drop', '.mediumInsert .mediumInsert-images img', function () {
        var index, $dragged, finalIndex;

        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }


        if (dropSortParent !== $(this).parent().parent().parent().attr('id')) {
          dropSort = false;
          dropSortIndex = dropSortParent = null;
          return;
        }

        index = parseInt(dropSortIndex, 10);

        // Sort
        $dragged = $(this).parent().parent().find('.mediumInsert-images:nth-child('+ (index+1) +')');
        finalIndex = $(this).parent().index();
        if(index < finalIndex) {
          $dragged.insertAfter($(this).parent());
        } else if(index > finalIndex) {
          $dragged.insertBefore($(this).parent());
        }

        $dragged.mouseleave();

        dropSort = true;
        dropSortIndex = null;

        that.$el.trigger('keyup').trigger('input');
      });

      this.$el.on('drop', '.mediumInsert', function (e) {
        var files;

        e.preventDefault();

        if ($.fn.mediumInsert.settings.enabled === false) {
          return;
        }

        $(this).removeClass('hover');
        that.$el.removeClass('hover');
        $(this).attr('contenteditable', false);

        files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
          // File upload
          that.uploadFiles($('.mediumInsert-placeholder', this), files, that);
        } else if (dropSort === true) {
          dropSort = false;
        } else {
          // Image move from block to block
          $('.mediumInsert-placeholder', this).append('<figure class="mediumInsert-images">'+ e.originalEvent.dataTransfer.getData('text/html') +'</figure>');
          $('meta', this).remove();
          dropSuccessful = true;
        }
      });
    }
  });
}(jQuery));
