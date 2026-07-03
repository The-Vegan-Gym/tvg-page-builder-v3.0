const AIRTABLE_CONFIG = {
    tokenEnvKey: 'AIRTABLE_TOKEN',
    baseId: 'appLBH1pqlKq7z0al',
    tables: {
        recipes: 'tblVMYnWxAZw3cxSN'
    }
};

if (typeof module !== 'undefined') {
    module.exports = AIRTABLE_CONFIG;
}
