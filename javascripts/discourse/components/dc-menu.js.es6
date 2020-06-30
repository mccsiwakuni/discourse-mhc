import discourseComputed from "discourse-common/utils/decorators";
import DiscourseURL from "discourse/lib/url";
import Component from "@ember/component";
import { action, computed } from "@ember/object";

export default Component.extend({
  elementId: "dc-menu",

  homepageURL: computed(function() {
    return settings.logo_href || Discourse.getURL("/");
  }),

  @action
  closeMenu() {
    $("body").removeClass("dc-menu-open");
  }
});
