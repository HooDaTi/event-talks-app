"""Flask application for browsing BigQuery release notes."""

import xml.etree.ElementTree as ET
from datetime import datetime

import requests
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = "{http://www.w3.org/2005/Atom}"


def fetch_release_notes():
    """Fetch and parse the BigQuery release notes Atom feed."""
    response = requests.get(FEED_URL, timeout=15)
    response.raise_for_status()

    root = ET.fromstring(response.content)
    entries = []

    for entry in root.findall(f"{ATOM_NS}entry"):
        title = entry.findtext(f"{ATOM_NS}title", "")
        entry_id = entry.findtext(f"{ATOM_NS}id", "")
        updated = entry.findtext(f"{ATOM_NS}updated", "")
        content = entry.findtext(f"{ATOM_NS}content", "")

        link_el = entry.find(f"{ATOM_NS}link[@rel='alternate']")
        link = link_el.get("href", "") if link_el is not None else ""

        # Parse date for sorting / display
        try:
            date_obj = datetime.fromisoformat(updated)
            display_date = date_obj.strftime("%B %d, %Y")
        except (ValueError, TypeError):
            display_date = title

        entries.append(
            {
                "title": title,
                "id": entry_id,
                "updated": updated,
                "display_date": display_date,
                "link": link,
                "content": content,
            }
        )

    return entries


@app.route("/")
def index():
    """Serve the main page."""
    return render_template("index.html")


@app.route("/api/notes")
def api_notes():
    """Return release notes as JSON."""
    try:
        entries = fetch_release_notes()
        return jsonify({"ok": True, "entries": entries})
    except requests.RequestException as exc:
        return jsonify({"ok": False, "error": str(exc)}), 502
    except ET.ParseError as exc:
        return jsonify({"ok": False, "error": f"XML parse error: {exc}"}), 502


if __name__ == "__main__":
    app.run(debug=True, port=5001)
