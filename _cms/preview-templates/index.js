import Post from "/_cms/preview-templates/post.js";
import Page from "/_cms/preview-templates/page.js";

// Register the Post component as the preview for entries in the notes collection
CMS.registerPreviewTemplate("notes", Post);
CMS.registerPreviewTemplate("pages", Page);

// Register any CSS file on the home page as a preview style
CMS.registerPreviewStyle("/_includes/assets/css/normalize.css");
CMS.registerPreviewStyle("/_includes/assets/css/variables.css");
CMS.registerPreviewStyle("/_includes/assets/css/base-styles.css");

fetch("/")
  .then(response => response.text())
  .then(html => {
    const f = document.createElement("html");
    f.innerHTML = html;
    Array.from(f.getElementsByTagName("link")).forEach(tag => {
      if (tag.rel == "stylesheet" && !tag.media) {
        CMS.registerPreviewStyle(tag.href);
      }
    });
  });
