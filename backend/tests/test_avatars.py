import base64

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def data_url(raw: bytes, mime: str = "image/png") -> str:
    return f"data:{mime};base64,{base64.b64encode(raw).decode()}"


def test_user_avatar_upload_replace_and_delete(client, login, tmp_path, monkeypatch):
    monkeypatch.setattr("app.config.UPLOADS_DIR", tmp_path)
    headers = login("user@demo.ru")
    first = client.put("/api/me/avatar", json={"image": data_url(PNG)}, headers=headers)
    assert first.status_code == 200
    url = first.json()["avatar_url"]
    assert url.startswith("/api/uploads/avatars/") and url.endswith(".png")
    assert client.get(url).content == PNG

    second = client.put(
        "/api/me/avatar", json={"image": data_url(b"\xff\xd8\xff" + b"\x00" * 32, "image/jpeg")}, headers=headers
    )
    assert second.json()["avatar_url"] != url
    assert client.get(url).status_code == 404

    removed = client.delete("/api/me/avatar", headers=headers)
    assert removed.json()["avatar_url"] is None


def test_avatar_rejects_non_images_and_big_files(client, login, tmp_path, monkeypatch):
    monkeypatch.setattr("app.config.UPLOADS_DIR", tmp_path)
    headers = login("user@demo.ru")
    assert client.put("/api/me/avatar", json={"image": "https://example.com/a.png"}, headers=headers).status_code == 400
    # Заявлен PNG, а внутри не картинка
    assert (
        client.put(
            "/api/me/avatar", json={"image": data_url(b"<script>alert(1)</script>")}, headers=headers
        ).status_code
        == 400
    )
    assert (
        client.put("/api/me/avatar", json={"image": data_url(PNG + b"\x00" * 600_000)}, headers=headers).status_code
        == 400
    )
    assert client.put("/api/me/avatar", json={"image": data_url(PNG)}).status_code == 401


def test_avatar_file_names_are_not_a_path(client):
    assert client.get("/api/uploads/avatars/..%2F..%2Fapp.db").status_code == 404
    assert client.get("/api/uploads/avatars/secret.txt").status_code == 404


def test_organization_avatar_needs_an_organization(client, login, tmp_path, monkeypatch):
    monkeypatch.setattr("app.config.UPLOADS_DIR", tmp_path)
    nobody = client.put("/api/me/organization/avatar", json={"image": data_url(PNG)}, headers=login("user@demo.ru"))
    assert nobody.status_code == 404
    owner = client.put("/api/me/organization/avatar", json={"image": data_url(PNG)}, headers=login("org@demo.ru"))
    assert owner.status_code == 200
    organization_id = owner.json()["id"]
    assert (
        client.get(f"/api/organizations/{organization_id}").json()["organization"]["avatar_url"]
        == owner.json()["avatar_url"]
    )
