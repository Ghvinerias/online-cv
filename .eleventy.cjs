const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });

  const md = markdownIt({ html: true, breaks: true, linkify: true });
  eleventyConfig.addFilter("markdown", (value = "") => md.render(value));

  eleventyConfig.setServerOptions({
    host: "0.0.0.0",
    port: 8080
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "dist"
    }
  };
};
