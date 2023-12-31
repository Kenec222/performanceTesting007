import Css from "../css";
import ClassNames from "../class-names";
import Environment from "../../environment/environment";

const getDefaultColors = (colorShades, bgStyle) => {
  let definitions;

  if (bgStyle === "filled") {
    definitions = {
      bgColor: "transparent",
      bgColorHover: colorShades.c200,
      bgColorActive: colorShades.c300,
      textColor: Environment.colors.common.darkText,
      textColorHover: Environment.colors.common.darkText,
      textColorActive: Environment.colors.common.darkText,
      borderColor: "transparent",
      borderColorHover: colorShades.c200,
      borderColorActive: colorShades.c300,
    };
  } else {
    definitions = {
      bgColor: "transparent",
      bgColorHover: colorShades.c200,
      bgColorActive: colorShades.c300,
      textColor: Environment.colors.common.darkText,
      textColorHover: Environment.colors.common.darkText,
      textColorActive: Environment.colors.common.darkText,
      borderColor: colorShades.c400,
      borderColorHover: colorShades.c400,
      borderColorActive: colorShades.c400,
    };
  }

  return definitions;
};

const getColors = (colorSchema, bgStyle) => {
  colorSchema = Environment.colorSchemaMap[colorSchema].color;
  let colorShades = getShades(colorSchema);

  if (!colorSchema || colorSchema === "custom") {
    return null;
  } else if (colorSchema === "default") {
    return getDefaultColors(colorShades, bgStyle);
  } else {
    return null;
  }
};

const getShades = (colorSchema) => {
  // get the most commonly used shades of the given colorSchema
  if (colorSchema === "default" || colorSchema === "grey" || !colorSchema) {
    return Environment.colors["grey"];
  } else {
    return Environment.colors[colorSchema.replace(/-rich/, "")];
  }
};

const getBgStyles = (bgStyle) => {
  let styles = ["default"].map((colorSchema) => {
    let colors = getColors(colorSchema, bgStyle);

    if (!colors) {
      // Something went wrong. Maybe the colorSchema doesn't exist
      return "";
    }

    let style = `
      background-color: ${colors.bgColor};
      color: ${colors.textColor};
      border-color: ${colors.borderColor};

      ${
        colorSchema !== "default"
          ? `
            &[class^="uu5-forms-"] {
              &.uu5-forms-input-form-item-text + .uu5-bricks-icon {
                color: ${colors.textColor};
              }

              .uu5-forms-input-form-item-value, .uu5-forms-input-form-item-value .uu5-bricks-icon {
                color: ${colors.textColor};
              }

              .uu5-forms-input-form-item-value + .uu5-bricks-icon,
              &.uu5-forms-input-form-item + .uu5-forms-text-icon-link .uu5-bricks-icon {
                color: ${colors.textColor};
              }
            }
          `
          : ""
      }

      ${
        bgStyle !== "filled"
          ? `
            .uu5-common-bg-style-filled,
            .uu5-common-bg-style-outline,
            .uu5-common-bg-style-underline,
            .uu5-common-bg-style-transparent,
            .uu5-common-bg-style-link,
            .uu5-common-text {
              &:not([class*="color-schema-"]) {
                color: ${colors.textColor};
              }
            }
          `
          : ""
      }

      &:not(.uu5-common-disabled).uu5-common-hover {
        &:active, &.active {
          background-color: ${colors.bgColorActive};
          border-color: ${colors.borderColorActive};

          ${colorSchema !== "default" ? `color: ${colors.textColorActive};` : ""}
        }

        &:active:hover, &.active:hover,
        &:active:focus, &.active:focus {
          background-color: ${colors.bgColorActive};
          border-color: ${colors.borderColorActive};

          ${colorSchema !== "default" ? `color: ${colors.textColorActive};` : ""}
        }

        &:hover, &:focus {
          background-color: ${colors.bgColorHover};
          border-color: ${colors.borderColorHover};

          ${colorSchema !== "default" ? `color: ${colors.textColorHover};` : ""}
        }
      }

      &:not(.uu5-common-disabled).uu5-common-focus:focus {
        background-color: ${colors.bgColorHover};
        border-color: ${colors.borderColorHover};

        ${colorSchema !== "default" ? `color: ${colors.textColorHover};` : ""}
      }

      &.uu5-forms-items-input {
        &:focus, &.uu5-forms-items-input-open {
          ${bgStyle !== "outline" && bgStyle !== "underline" ? `background-color: ${colors.bgColorHover}` : ""};
          border-color: ${colors.borderColorHover};

          ${colorSchema !== "default" ? `color: ${colors.textColorHover};` : ""}
        }
      }

      .uu5-forms-text-input:focus {
        box-shadow: inset 0 0 0 1px ${colors.borderColor};
      }
    `;

    const bgStyleClassName = ClassNames[bgStyle];

    return `
      .${bgStyleClassName},
      .${bgStyleClassName}.color-schema-${colorSchema},
      .color-schema-${colorSchema} .${bgStyleClassName}:not([class*="color-schema-"]) {
        &, &.uu5-forms-items-input {
          ${style}
        }
      }
    `;
  });

  return styles.join(" ");
};

["filled", "outline", "transparent", "underline"].forEach((bgStyle) => {
  return Css.injectGlobal`${getBgStyles(bgStyle)}`;
});
