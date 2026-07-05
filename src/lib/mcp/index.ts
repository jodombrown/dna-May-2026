import { defineMcp } from "@lovable.dev/mcp-js";
import searchProfiles from "./tools/search-profiles";
import getProfile from "./tools/get-profile";
import listEvents from "./tools/list-events";
import listCommunities from "./tools/list-communities";

export default defineMcp({
  name: "dna-platform-mcp",
  title: "DNA (Diaspora Network of Africa)",
  version: "0.2.0",
  instructions:
    "Tools for exploring the DNA platform — the operating system for the Global African Diaspora. Use `search_profiles` and `get_profile` to look up public member profiles (shareable at /dna/<username>), `list_upcoming_events` to discover upcoming public events across the Convene module, and `list_communities` to discover active African diaspora communities. All tools return public data only and validate their inputs strictly; malformed calls return a typed error with `code` and `message`.",
  tools: [searchProfiles, getProfile, listEvents, listCommunities],
});
