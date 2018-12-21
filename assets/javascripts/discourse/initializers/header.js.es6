import { withPluginApi } from "discourse/lib/plugin-api";
import { applyDecorators } from "discourse/widgets/widget";
import { h } from "virtual-dom";

export default {
  name: "debtcollective-header",
  initialize() {
    withPluginApi("0.8.9", api => {
      /**
       * Render headers links
       * Taken from https://github.com/hnb-ku/discourse-custom-header-links/blob/master/common/header.html
       */

      api.decorateWidget("home-logo:after", helper => {
        /**
         * Something changed in the latest version of Discourse https://meta.discourse.org/t/custom-header-links/90588/16
         * For now I'm just wrapping this in a setTimeout
         */
        setTimeout(() => {
          const titleVisible = helper.attrs.minimized;
          //eslint-disable-next-line

          if (titleVisible) {
            $(".header-link:not(.keep)").hide();
          } else {
            $(".header-link").show();
          }
        }, 0);
      });

      /**
       * List settings in Discourse are strings separated by '|'
       * Header links follow this pattern
       * label, title, href, className, target, keep
       *
       * keep is used to preserve the link when scrolling inside a topic
       */
      const headerLinks = headerLinksConfig => {
        return headerLinksConfig.split("|").map(headerItem => {
          const headerConfig = headerItem.split(",").map(value => value.trim());
          const [label, title, href, className, target, keep] = headerConfig;

          return {
            label,
            title,
            href,
            className,
            target: target === "self" ? "" : "_blank",
            keep: keep !== "keep" ? "" : "keep"
          };
        });
      };

      const debtcollectiveLinks = headerLinks(
        Discourse.SiteSettings.debtcollective_header_links
      );

      // Add links to the header
      debtcollectiveLinks.forEach(link => {
        api.decorateWidget("header-buttons:before", helper => {
          return helper.h(
            `li.header-link.${link.className}.${link.keep}`,
            helper.h(
              "a",
              {
                href: link.href,
                title: link.title,
                target: link.target
              },
              link.label
            )
          );
        });
      });

      api.reopenWidget("hamburger-menu", {
        panelContents() {
          const { currentUser } = this;
          const results = [];

          // Insert debtcollective links at the top of the menu
          if (debtcollectiveLinks.length > 0) {
            results.push(
              this.attach("menu-links", {
                name: "debtcollective-links",
                heading: true,
                contents: () => {
                  return debtcollectiveLinks.map(l => {
                    return this.attach("link", {
                      href: l.href,
                      rawLabel: l.label
                    });
                  });
                }
              })
            );
          }

          let faqUrl = this.siteSettings.faq_url;
          if (!faqUrl || faqUrl.length === 0) {
            faqUrl = Discourse.getURL("/faq");
          }

          const prioritizeFaq =
            this.settings.showFAQ &&
            this.currentUser &&
            !this.currentUser.read_faq;

          if (prioritizeFaq) {
            results.push(
              this.attach("menu-links", {
                name: "faq-link",
                heading: true,
                contents: () => {
                  return this.attach("priority-faq-link", { href: faqUrl });
                }
              })
            );
          }

          if (currentUser && currentUser.staff) {
            results.push(
              this.attach("menu-links", {
                name: "admin-links",
                contents: () => {
                  const extraLinks = _.flatten(
                    applyDecorators(this, "admin-links", this.attrs, this.state)
                  );
                  return this.adminLinks().concat(extraLinks);
                }
              })
            );
          }

          results.push(
            this.attach("menu-links", {
              name: "general-links",
              contents: () => this.generalLinks()
            })
          );

          if (this.settings.showCategories) {
            results.push(this.listCategories());
            results.push(h("hr"));
          }

          results.push(
            this.attach("menu-links", {
              name: "footer-links",
              omitRule: true,
              contents: () => this.footerLinks(prioritizeFaq, faqUrl)
            })
          );

          return results;
        }
      });
    });
  }
};