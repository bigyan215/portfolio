(function($){
  'use strict';

  $(function(){
    $('.contact-form').on('submit', function(e){
      e.preventDefault();
      var $form = $(this);
      var $btn = $form.find('button[type="submit"]');
      var $resp = $('#contact-response');
      $resp.stop(true,true).show().html('');
      $btn.prop('disabled', true).text('Sending...');

      $.ajax({
        type: 'POST',
        url: $form.attr('action'),
        data: $form.serialize(),
        success: function(data){
          $resp.html('<div class="alert alert-success">Message sent. Thank you!</div>');
          $form[0].reset();
        },
        error: function(xhr){
          var msg = 'Send failed. Please try again later.';
          try { if (xhr && xhr.responseJSON && xhr.responseJSON.error) msg = xhr.responseJSON.error; } catch(e){}
          $resp.html('<div class="alert alert-danger">'+msg+'</div>');
        },
        complete: function(){
          $btn.prop('disabled', false).text('Send');
          setTimeout(function(){ $resp.fadeOut(500, function(){ $(this).html('').show(); }); }, 5000);
        }
      });
    });
  });

})(window.jQuery);
