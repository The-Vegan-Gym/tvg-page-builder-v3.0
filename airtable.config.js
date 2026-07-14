const AIRTABLE_CONFIG = {
    tokenEnvKey: 'AIRTABLE_TOKEN',
    baseIdEnvKey: 'BASE_ID',
    tableEnvKeys: {
        recipes: 'TABLE_ID',
        pageRecords: 'PAGE_RECORDS_TABLE_ID',
        coachProfiles: 'COACH_PROFILES_TABLE_ID'
    }
};

if (typeof module !== 'undefined') {
    module.exports = AIRTABLE_CONFIG;
}
