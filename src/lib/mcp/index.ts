import { defineMcp } from "@lovable.dev/mcp-js";
import getProfile from "./tools/get-profile";
import listEvents from "./tools/list-events";
import listCommunities from "./tools/list-communities";

export default defineMcp({
  name: "dna-platform-mcp",
  title: "DNA (Diaspora Network of Africa)",
  version: "0.3.0",
  instructions:
    "Tools for exploring the DNA (Diaspora Network of Africa) platform, the mobilization infrastructure for the Global African Diaspora's return. Use `get_profile` to look up a public member profile by its /dna/<username> handle, `list_upcoming_events` to discover upcoming public events across the Convene module, and `list_communities` to discover active African diaspora communities. All tools return public data only and validate their inputs strictly; malformed calls return a typed error with `code` and `message`.",
  tools: [getProfile, listEvents, listCommunities],
});
