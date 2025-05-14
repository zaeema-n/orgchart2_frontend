import requests

BASE_URL = "http://localhost:8080/entities"
START_2015_04_11 = "2015-04-11T00:00:00Z"
START_2015_04_15 = "2015-04-15T00:00:00Z"

def create_entity(entity_id, major, minor, name, start_time):
    payload = {
        "id": entity_id,
        "kind": {"major": major, "minor": minor},
        "created": start_time,
        "terminated": "",
        "name": {
            "startTime": start_time,
            "endTime": "",
            "value": name
        },
        "metadata": []
    }
    res = requests.post(BASE_URL, json=payload)
    print(f"[{res.status_code}] Created entity {name}: {res.text}")
    assert res.status_code in [200, 201]

def create_relationship(source_id, rel_key, rel_id, target_id, start_time, end_time=""):
    url = f"{BASE_URL}/{source_id}"
    payload = {
        "id": source_id,
        "kind": {},
        "created": "",
        "terminated": "",
        "name": {},
        "metadata": [],
        "attributes": [],
        "relationships": [
            {
                "key": rel_key,
                "value": {
                    "relatedEntityId": target_id,
                    "startTime": start_time,
                    "endTime": end_time,
                    "id": rel_id,
                    "name": rel_key
                }
            }
        ]
    }
    res = requests.put(url, json=payload)
    print(f"[{res.status_code}] {rel_key} from {source_id} to {target_id}: {res.text}")
    assert res.status_code in [200]

def main():
    # Government
    create_entity("gov_srilanka", "Organization", "Government", "Government of Sri Lanka", START_2015_04_11)

    # Ministers
    create_entity("minister_education", "Organization", "Minister", "Minister of Education", START_2015_04_11)
    create_entity("minister_defence", "Organization", "Minister", "Minister of Defence", START_2015_04_11)

    # Link ministers to Government
    create_relationship("gov_srilanka", "HAS_MINISTER", "rel_gov_min_edu", "minister_education", START_2015_04_11)
    create_relationship("gov_srilanka", "HAS_MINISTER", "rel_gov_min_def", "minister_defence", START_2015_04_11)

    # Education Departments
    create_entity("dept_ed_publications", "Organization", "Department", "Department of Educational Publications", START_2015_04_11)
    create_entity("dept_exams", "Organization", "Department", "Department of Exams", START_2015_04_11)
    create_entity("dept_nie", "Organization", "Department", "National Institute of Exams", START_2015_04_11)

    # Defence Departments
    create_entity("dept_army", "Organization", "Department", "Sri Lanka Army", START_2015_04_11)
    create_entity("dept_navy", "Organization", "Department", "Sri Lanka Navy", START_2015_04_11)
    create_entity("dept_airforce", "Organization", "Department", "Sri Lanka Airforce", START_2015_04_11)

    # Relationships from Minister of Education
    create_relationship("minister_education", "HAS_DEPARTMENT", "rel_ed_pubs", "dept_ed_publications", START_2015_04_11)
    create_relationship("minister_education", "HAS_DEPARTMENT", "rel_ed_exams", "dept_exams", START_2015_04_11)
    create_relationship("minister_education", "HAS_DEPARTMENT", "rel_ed_nie", "dept_nie", START_2015_04_11)

    # Relationships from Minister of Defence
    create_relationship("minister_defence", "HAS_DEPARTMENT", "rel_def_army", "dept_army", START_2015_04_11)
    create_relationship("minister_defence", "HAS_DEPARTMENT", "rel_def_navy", "dept_navy", START_2015_04_11)
    create_relationship("minister_defence", "HAS_DEPARTMENT", "rel_def_air", "dept_airforce", START_2015_04_11)

    # Terminate Dept of Exams from Minister of Education on 2015-04-15
    create_relationship("minister_education", "HAS_DEPARTMENT", "rel_ed_exams", "dept_exams", START_2015_04_11, START_2015_04_15)

    # Add Dept of Exams to Minister of Defence on 2015-04-15
    create_relationship("minister_defence", "HAS_DEPARTMENT", "rel_def_exams", "dept_exams", START_2015_04_15)

if __name__ == "__main__":
    main()
