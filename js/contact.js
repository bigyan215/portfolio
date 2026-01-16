
(function($){
  'use strict';

  $(function(){
    $('.contact-form').on('submit', function(e){
      e.preventDefault();
      var $form = $(this);
      var $btn = $form.find('button[type="submit"]');
      var $resp = $('#contact-response');
      $resp.stop(true,true).show().html('');

      // Client-side validation
      var name = $.trim($form.find('input[name="name"]').val() || '');
      var email = $.trim($form.find('input[name="email"]').val() || '');
      var message = $.trim($form.find('textarea[name="message"]').val() || '');
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || !email || !message) {
        $resp.html('<div class="alert alert-danger">Please fill in all required fields.</div>');
        return;
      }
      if (!emailRe.test(email)) {
        $resp.html('<div class="alert alert-danger">Please enter a valid email address.</div>');
        return;
      }

      // show spinner in button
      var originalBtnHtml = $btn.html();
      $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...');

      var apiBase = $('meta[name="api-base"]').attr('content') || '';
      var endpoint = apiBase ? apiBase.replace(/\/+$/,'') + '/api/contact'
                             : ($form.attr('action') || '/api/contact');

      $.ajax({
        type: 'POST',
        url: endpoint,
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
          $btn.prop('disabled', false).html(originalBtnHtml);
          setTimeout(function(){ $resp.fadeOut(500, function(){ $(this).html('').show(); }); }, 5000);
        }
      });
    });
  });

})(window.jQuery);
