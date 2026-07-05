import { defineMcp } from "@lovable.dev/mcp-js";
import searchProfiles from "./tools/search-profiles";
import listEvents from "./tools/list-events";
import getProfile from "./tools/get-profile";

export default defineMcp({
  name: "dna-platform-mcp",
  title: "DNA (Diaspora Network of Africa)",
  version: "0.1.0",
  instructions:
    "Tools for exploring the DNA platform — the operating system for the Global African Diaspora. Use `search_profiles` and `get_profile` to look up public member profiles (shareable at /dna/<username>), and `list_upcoming_events` to discover upcoming public events across the Convene module. All tools return public data only.",
  tools: [searchProfiles, getProfile, listEvents],
});
