/*
  Copyright (c) Kenneth Chung
  twitter: @kentor
  github: kentor

  created: Auguest 27, 2012
*/

function componentToHex(c) {
  var hex = c.toString(16)
  return hex.length == 1 ? "0" + hex : hex
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
}

function drawCrosshair(ctx, r, g, b) {
  ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.5)'
  ctx.beginPath()
  ctx.moveTo(5.5, 0)
  ctx.lineTo(5.5, 4)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(7, 5.5)
  ctx.lineTo(11, 5.5)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(5.5, 7)
  ctx.lineTo(5.5, 11)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, 5.5)
  ctx.lineTo(4, 5.5)
  ctx.stroke()
}

$(document).ready(function() {
  $(window).resize(function() {
    var intro = $('#intro')
    intro.css('margin-top', -intro.outerHeight() / 2)
  }).resize()

  $('#info').draggable().find('input').click(function() {
    this.select()
  })

  var crosshair = document.getElementById('crosshair').getContext('2d')

  /* pasting */
  if (!window.Clipboard) {
    var pasteCatcher = $('<div>')
                         .attr('contenteditable', '')
                         .css('opacity', 0)
                         .appendTo('body')
                         .focus()

    $(window).click(function() { pasteCatcher.focus() })
  } 

  window.addEventListener('paste', function(e) {
    if (e.clipboardData) {
      var items = e.clipboardData.items

      for (var i = 0; i < items.length; i++) {
        if (!items[i].type.match(/image/)) continue
          
        var blob = items[i].getAsFile()
          , urlobj = window.URL || window.webkitURL
          , source = urlobj.createObjectURL(blob)
         
        createImage(source)
      }
    }
    else {
      setTimeout(function() {
        var child = pasteCatcher.find('img')[0]

        pasteCatcher.empty()
       
        if (child) createImage(child.src)
      }, 0)
    }
  })

  /* dropping, only works on WebKit */
  window.addEventListener('drop', function(e) {
    e.preventDefault()

    files = e.dataTransfer.files

    if (files.length && files[0].type.match(/image/)) {
      var urlobj = window.URL || window.webkitURL
        , source = urlobj.createObjectURL(files[0])
        
      createImage(source)
    }
  })

  function createImage(source) {
    var img = new Image()
    img.onload = function() {
      $('#intro').remove()

      $('#info').show().mouseleave(function() {
        $(this).find('input').blur()
      })

      var zoomed = document.getElementById('zoomed')
        , ztx = zoomed.getContext('2d')
        , zoom = 3

      zoomed.width = img.width * zoom
      zoomed.height = img.height * zoom
      ztx.imageSmoothingEnabled = false
      ztx.mozImageSmoothingEnabled = false
      ztx.webkitImageSmoothingEnabled = false
      ztx.drawImage(img, 0, 0, zoomed.width, zoomed.height)

      var canvas = document.getElementById('source')
        , ctx = canvas.getContext('2d')

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      $('#board').show().append(canvas)

      $(canvas)
        .on('mousemove.color', function(e) {
          var x = e.pageX
            , y = e.pageY
            , d = ctx.getImageData(x, y, 1, 1).data
            , r = d[0]
            , g = d[1]
            , b = d[2]
            , ir = 255 - r
            , ig = 255 - g
            , ib = 255 - b
            , hex = rgbToHex(r, g, b)
            , inv = rgbToHex(ir, ig, ib)

          $('#coord').html(x + ' x ' + y).css('color', inv)
          $('#rgb-hover').val(r + ',' + g + ',' + b)
          $('#hex-hover').val(hex)
          $('#color-hover').css('background', hex)

          $('#zoomed')
            .css('left', -(zoom * x) + $('#zoomer').width() / 2)
            .css('top', -(zoom * y) + $('#zoomer').height() / 2)

          drawCrosshair(crosshair, ir, ig, ib)
        })
        .mousedown(function(e) {
          if (e.which !== 1) return

          var x0 = e.clientX
            , y0 = e.clientY

          $(this).on('mousemove.dragscroll', function(e) {
            var $window = $(window)
              , x = e.clientX
              , y = e.clientY

            $window
              .scrollLeft($window.scrollLeft() + x0 - x)
              .scrollTop($window.scrollTop() + y0 - y)

            x0 = x
            y0 = y

            e.preventDefault()
          })

          e.preventDefault()
        })
        .on('mouseup mouseleave', function() {
          $(this).off('mousemove.dragscroll')
        })
        .contextmenu(function() {
          $('#rgb-saved').val($('#rgb-hover').val())
          $('#hex-saved').val($('#hex-hover').val())
          $('#color-saved').css('background', $('#hex-hover').val())

          return false
        })

      $(window).keydown(function(e) {
        if (e.keyCode == 67 && e.ctrlKey && e.target.tagName !== 'INPUT') {
          var hex = document.getElementById('hex-hover')
          hex.focus()
          hex.select()
          setTimeout(function() { hex.blur() }, 100)
        }
      })
    }
    img.src = source
  }
})
