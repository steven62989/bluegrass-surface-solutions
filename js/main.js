/* Bluegrass Surface Solutions - shared site behavior */
(function () {
  "use strict";

  var CONTACT_EMAIL = "Bluegrasssurfacesolutions@gmail.com";
  var CONTACT_PHONE = "937-203-9991";

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("main-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Highlight the current page in the nav without needing a template engine.
    var links = nav.querySelectorAll("a[href]");
    var current = window.location.pathname.split("/").pop() || "index.html";
    links.forEach(function (link) {
      var linkPage = link.getAttribute("href").split("/").pop();
      if (linkPage === current) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function initFaqDeepLinks() {
    // Auto-open an FAQ item if the page is loaded with a matching #hash.
    if (!window.location.hash) return;
    var target = document.querySelector(window.location.hash);
    if (target && target.tagName === "DETAILS") {
      target.open = true;
    }
  }

  function setFieldError(field, message) {
    var wrapper = field.closest(".form-field");
    if (!wrapper) return;
    var errorEl = wrapper.querySelector(".field-error");
    wrapper.classList.toggle("has-error", Boolean(message));
    if (errorEl) errorEl.textContent = message || "";
  }

  function validateQuoteForm(form) {
    var valid = true;
    var firstInvalid = null;

    var requiredFields = form.querySelectorAll("[data-required='true']");
    requiredFields.forEach(function (field) {
      var value = field.type === "checkbox" ? field.checked : field.value.trim();
      var isEmpty = field.type === "checkbox" ? !value : value.length === 0;
      if (isEmpty) {
        setFieldError(field, field.dataset.errorMessage || "This field is required.");
        valid = false;
        firstInvalid = firstInvalid || field;
      } else {
        setFieldError(field, "");
      }
    });

    var emailField = form.querySelector("#email");
    if (emailField && emailField.value.trim()) {
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim());
      if (!emailOk) {
        setFieldError(emailField, "Enter a valid email address.");
        valid = false;
        firstInvalid = firstInvalid || emailField;
      }
    }

    var servicesGroup = form.querySelector("[data-required-group='services']");
    if (servicesGroup) {
      var checked = servicesGroup.querySelectorAll("input[type='checkbox']:checked");
      var groupError = servicesGroup.parentElement.querySelector(".field-error");
      if (checked.length === 0) {
        if (groupError) groupError.textContent = "Select at least one service.";
        valid = false;
        firstInvalid = firstInvalid || servicesGroup;
      } else if (groupError) {
        groupError.textContent = "";
      }
    }

    if (firstInvalid && typeof firstInvalid.focus === "function") {
      firstInvalid.focus();
    }

    return valid;
  }

  function buildMailtoLink(form) {
    var get = function (name) {
      var field = form.querySelector("[name='" + name + "']");
      return field ? field.value.trim() : "";
    };
    var services = Array.from(
      form.querySelectorAll("input[name='servicesRequested']:checked")
    )
      .map(function (el) {
        return el.value;
      })
      .join(", ");

    var subject = "Commercial Quote Request - " + (get("companyName") || get("lastName"));
    var bodyLines = [
      "First name: " + get("firstName"),
      "Last name: " + get("lastName"),
      "Company/property name: " + get("companyName"),
      "Phone: " + get("phone"),
      "Email: " + get("email"),
      "Property address: " + get("propertyAddress"),
      "City: " + get("city"),
      "Property type: " + get("propertyType"),
      "Services requested: " + services,
      "Preferred timing: " + get("preferredTiming"),
      "Message: " + get("message")
    ];

    var mailto =
      "mailto:" +
      encodeURIComponent(CONTACT_EMAIL) +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(bodyLines.join("\n"));

    return mailto;
  }

  function initQuoteForm() {
    var form = document.getElementById("quote-form");
    if (!form) return;

    var statusEl = document.getElementById("form-status");
    var submitBtn = form.querySelector("button[type='submit']");
    var submitLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;
    var loadedAt = Date.now();

    function showStatus(type, html) {
      if (!statusEl) return;
      statusEl.className = "form-status is-visible form-status--" + type;
      statusEl.innerHTML = html;
      statusEl.setAttribute("role", type === "error" ? "alert" : "status");
      statusEl.focus();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!validateQuoteForm(form)) {
        showStatus(
          "error",
          "Please correct the highlighted fields and try again."
        );
        return;
      }

      // Basic spam protection: honeypot field + minimum time-on-page check.
      var honeypot = form.querySelector("input[name='website']");
      var isBotHoneypot = honeypot && honeypot.value.trim().length > 0;
      var isBotTooFast = Date.now() - loadedAt < 2000;

      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitLabel) submitLabel.textContent = "Sending...";
        submitBtn.insertAdjacentHTML("afterbegin", '<span class="spinner" aria-hidden="true"></span> ');
      }

      window.setTimeout(function () {
        if (isBotHoneypot || isBotTooFast) {
          // Silently treat likely-bot submissions as "successful" without sending anything.
          showStatus(
            "success",
            "Thank you. Your request has been received."
          );
          form.reset();
          resetSubmitButton();
          return;
        }

        var mailto = buildMailtoLink(form);
        window.location.href = mailto;

        showStatus(
          "success",
          "Thank you! Your email application should now open with your request pre-filled to send to us. " +
            "If it doesn't open, please email us directly at " +
            "<a href=\"mailto:" + CONTACT_EMAIL + "\">" + CONTACT_EMAIL + "</a>" +
            " or call <a href=\"tel:+1" + CONTACT_PHONE.replace(/\D/g, "") + "\">" + CONTACT_PHONE + "</a>."
        );
        form.reset();
        resetSubmitButton();
      }, 600);
    });

    function resetSubmitButton() {
      if (!submitBtn) return;
      submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = "Request a Site Walkthrough";
      var spinner = submitBtn.querySelector(".spinner");
      if (spinner) spinner.remove();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initFaqDeepLinks();
    initQuoteForm();
    var yearEl = document.getElementById("current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
