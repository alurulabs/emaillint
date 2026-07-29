import type { EmailRule } from "../types/index.js";
import { htmlSizeRule } from "./performance/html-size.js";
import { imgMissingAltRule } from "./accessibility/img-missing-alt.js";
import { emptyLinkRule } from "./quality/empty-link.js";
import { duplicateIdRule } from "./quality/duplicate-id.js";
import { base64ImageRule } from "./performance/base64-image.js";
import { flexboxRule } from "./compatibility/flexbox.js";
import { customPropertyRule } from "./compatibility/custom-property.js";
import { borderRadiusRule } from "./compatibility/border-radius.js";
import { backgroundImageRule } from "./compatibility/background-image.js";
import { absolutePositionRule } from "./compatibility/absolute-position.js";
import { externalFontRule } from "./compatibility/external-font.js";
import { cssRules } from "./compatibility/css-rules.js";
import { elementRules } from "./compatibility/element-rules.js";
import { htmlMissingLangRule } from "./accessibility/html-lang.js";
import { htmlMissingTitleRule } from "./accessibility/html-title.js";
import { linkEmptyTextRule } from "./accessibility/link-empty-text.js";
import { headingEmptyRule } from "./accessibility/heading-empty.js";
import { htmlMissingDoctypeRule } from "./quality/html-doctype.js";
import { compatFor } from "./compat-lookup.js";

export const rules: EmailRule[] = [
  htmlSizeRule,
  imgMissingAltRule,
  emptyLinkRule,
  duplicateIdRule,
  base64ImageRule,
  flexboxRule,
  customPropertyRule,
  borderRadiusRule,
  backgroundImageRule,
  absolutePositionRule,
  externalFontRule,
  ...cssRules,
  ...elementRules,
  htmlMissingLangRule,
  htmlMissingTitleRule,
  linkEmptyTextRule,
  headingEmptyRule,
  htmlMissingDoctypeRule,
].map((r) =>
  r.category === "compatibility" && r.features && r.features.length
    ? { ...r, compatibility: compatFor(r.features, { alternatives: r.alternatives }) }
    : r
);
