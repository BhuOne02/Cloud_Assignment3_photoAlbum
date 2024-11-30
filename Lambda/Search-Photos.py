import json
import logging
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection

# Initialize Lex client and logger
lex_runtime_client = boto3.client('lexv2-runtime')
log_handler = logging.getLogger()
log_handler.setLevel(logging.DEBUG)

# Configure OpenSearch connection
search_service = OpenSearch(
    hosts=[{'host': 'search-photos-vl5oki2mvw64szoi6xjrugtr5m.us-east-1.es.amazonaws.com', 'port': 443}],
    http_auth=('admin', 'Admin@123'),
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

# Validate if the given string is meaningful
def is_valid_string(input_string):
    return bool(input_string and input_string.strip())

# Extract relevant labels from Lex slots
def extract_labels_from_slots(slot_data):
    extracted_labels = []
    for slot_name, slot_info in slot_data.items():
        if slot_info and "value" in slot_info:
            interpreted_value = slot_info['value'].get('interpretedValue')
            if interpreted_value:
                extracted_labels.append(interpreted_value)
    return extracted_labels

# Retrieve image metadata from OpenSearch based on labels
def fetch_images_by_labels(label_list):
    image_metadata = []
    log_handler.debug(f"Searching images with labels: {label_list}")
    for label in label_list:
        search_response = search_service.search({"query": {"match": {"labels": label}}})
        hits = search_response['hits']['hits']
        for hit in hits:
            image_metadata.append(hit['_source'])
    return image_metadata

# Lambda function handler
def lambda_handler(event, context):
    log_handler.debug(f"Lambda context: {context}")
    log_handler.debug(f"Lambda event: {event}")

    user_query = event.get("query", "")
    log_handler.info(f"User input query: {user_query}")

    # Lex bot configuration
    bot_id = 'PW9WLMFRZQ'
    bot_alias_id = '9BXMDQ8VZI'
    locale_id = 'en_US'

    # Process input with Lex
    lex_response = lex_runtime_client.recognize_text(
        botId=bot_id,
        botAliasId=bot_alias_id,
        localeId=locale_id,
        sessionId="001",
        text=user_query
    )
    log_handler.debug(f"Lex response: {lex_response}")

    # Extract labels from Lex response
    slot_data = lex_response.get('sessionState', {}).get('intent', {}).get('slots', {})
    log_handler.debug(f"Lex slot data: {slot_data}")
    labels_to_search = extract_labels_from_slots(slot_data)
    log_handler.info(f"Extracted labels: {labels_to_search}")

    # Fetch images from OpenSearch
    image_data = fetch_images_by_labels(labels_to_search)
    log_handler.info(f"Retrieved image metadata: {image_data}")

    # Prepare HTTP response
    return {
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'statusCode': 200,
        'body': json.dumps(image_data)
    }
