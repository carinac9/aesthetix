from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import pickle
import pandas as pd
import json
import psycopg2
from flask import g

app = Flask(__name__)
CORS(app)

load_dotenv()


def get_db():
    if 'db' not in g:
        g.db = psycopg2.connect(
            dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST')
        )
    return g.db


@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()


try:
    design_data = pd.read_csv(
        'datasets/design/Pinterest Interior Design Images and Metadata/metadata.csv')
    print(f"Loaded Pinterest metadata with {len(design_data)} entries")
except Exception as e:
    design_data = None
    print(f"Error loading metadata.csv: {e}")

try:
    with open('datasets/furniture/ikea-master/text_data/products_dict_with_links.p', 'rb') as f:
        ikea_data = pickle.load(f)
        print(f"Loaded IKEA dataset with {len(ikea_data)} items")
except Exception as e:
    ikea_data = None
    print(f"Error loading IKEA dataset: {e}")

SAVED_DIR = "saved_templates"
os.makedirs(SAVED_DIR, exist_ok=True)


@app.route('/recommend', methods=['POST'])
def recommend():
    if design_data is None:
        return jsonify({"error": "Design data failed to load."}), 500

    data = request.json
    prompt = data.get('prompt', '').lower().strip()
    words = prompt.split()

    def match_score(row):
        combined = f"{row['room_type']} {row['style']} {row['image_path']}".lower()
        return sum(1 for word in words if word in combined)

    design_data['score'] = design_data.apply(match_score, axis=1)
    filtered_design = design_data[design_data['score'] > 0].sort_values(
        by='score', ascending=False)

    design_samples = []
    for _, row in filtered_design.iterrows():
        rel_path = row['image_path'].replace(
            '\\', '/').replace('../data/raw/', '')
        full_path = os.path.join(
            'datasets/design/Pinterest Interior Design Images and Metadata', rel_path)

        if os.path.exists(full_path):
            design_samples.append({
                'room_type': row['room_type'],
                'style': row['style'],
                'filename': os.path.basename(rel_path),
                'image_url': f"http://127.0.0.1:8000/datasets/design/images/{rel_path}"
            })

    context_words = set(words)
    if design_samples:
        top = design_samples[0]
        context_words.update(top['style'].lower().split())
        context_words.update(top['room_type'].lower().split())

    filtered_ikea = {
        k: v for k, v in ikea_data.items()
        if any(word in (v['name'] + ' ' + v['desc']).lower() for word in context_words)
    }

    ikea_samples = []
    for k, v in filtered_ikea.items():
        v['image_url'] = f"http://127.0.0.1:8000/datasets/furniture/ikea-master/{v['img']}"
        ikea_samples.append(v)

    return jsonify({
        "design_samples": design_samples,
        "ikea_samples": ikea_samples
    })


@app.route('/saved-templates', methods=['POST'])
def save_template():
    data = request.json
    user_id = data.get("user_id")
    name = data.get("name", "template")
    design = json.dumps(data.get("design"))
    furniture = json.dumps(data.get("furniture"))
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    db = get_db()
    cur = db.cursor()
    cur.execute(
        "INSERT INTO templates (user_id, name, design, furniture) VALUES (%s, %s, %s, %s)",
        (user_id, name, design, furniture)
    )
    db.commit()
    cur.close()
    return jsonify({"message": f"Template '{name}' saved successfully."})


@app.route('/get-templates', methods=['GET'])
def get_templates():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify([])
    db = get_db()
    cur = db.cursor()
    cur.execute(
        "SELECT name, design, furniture FROM templates WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    templates = []
    for name, design, furniture in cur.fetchall():

        if isinstance(design, str):
            design_obj = json.loads(design)
        else:
            design_obj = design
        if isinstance(furniture, str):
            furniture_obj = json.loads(furniture)
        else:
            furniture_obj = furniture
        templates.append({
            "name": name,
            "design": design_obj,
            "furniture": furniture_obj
        })
    cur.close()
    return jsonify(templates)


@app.route('/delete-template', methods=['POST'])
def delete_template():
    data = request.json
    user_id = data.get("user_id")
    name = data.get("name")
    if not user_id or not name:
        return jsonify({"error": "user_id and name required"}), 400
    db = get_db()
    cur = db.cursor()
    cur.execute(
        "DELETE FROM templates WHERE user_id = %s AND name = %s", (user_id, name))
    db.commit()
    cur.close()
    return jsonify({"message": "Deleted."})


@app.route('/datasets/design/images/<path:rel_path>')
def serve_design_image(rel_path):
    full_dir = os.path.join(
        'datasets/design/Pinterest Interior Design Images and Metadata', os.path.dirname(rel_path))
    file = os.path.basename(rel_path)
    return send_from_directory(full_dir, file)


@app.route('/datasets/furniture/ikea-master/<path:filename>')
def serve_ikea_image(filename):
    full_path = os.path.join('datasets/furniture/ikea-master', filename)
    directory = os.path.dirname(full_path)
    file = os.path.basename(full_path)
    return send_from_directory(directory, file)


if __name__ == '__main__':
    app.run(debug=True, port=8000)
