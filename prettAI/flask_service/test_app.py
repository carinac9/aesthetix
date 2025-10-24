import json

def test_recommend_endpoint(client):
    response = client.post('/recommend', json={"prompt": "modern living room"})
    assert response.status_code == 200
    data = response.get_json()
    assert "design_samples" in data
    assert "ikea_samples" in data


def test_save_template_missing_user_id(client):
    response = client.post('/saved-templates', json={"name": "test", "design": {}, "furniture": {}})
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_get_templates_no_user_id(client):
    response = client.get('/get-templates')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)


def test_delete_template_missing_fields(client):
    response = client.post('/delete-template', json={"name": "test"})
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
