export {
    PLUGIN_TITLE,
    PLUGIN_VERSION,
    PLUGIN_NAME,
    RISU_ARGS,
    RisuArgType,
    IS_LOGGED_IN,
    ACCESS_TOKEN,
    ACCESS_TOKEN_EXPIRES,
    REFRESH_TOKEN,
    PROJECT_ID,
    SERVICE_TIER,
    OPT_OUT,
    MODEL_CONFIG,
    CREDIT_OVERAGE,
};

enum RisuArgType {
    String = 'string',
    Int = 'int',
}

interface RisuArgs {
    [key: string]: RisuArgType;
}

// Plugin Info
const PLUGIN_TITLE = 'risu-antigravity'
const PLUGIN_VERSION = 'v1.0.0'
const PLUGIN_NAME = `${PLUGIN_TITLE}-${PLUGIN_VERSION}`

// Argument Name Definitions
const IS_LOGGED_IN = 'is_logged_in'
const ACCESS_TOKEN = 'access_token'
const ACCESS_TOKEN_EXPIRES = 'access_token_expires'
const REFRESH_TOKEN = 'refresh_token'
const PROJECT_ID = 'project_id'
const SERVICE_TIER = 'service_tier'
const OPT_OUT = 'opt_out'
const MODEL_CONFIG = 'model_config'
const CREDIT_OVERAGE = 'credit_overage'

// Plugin Arguments Definition
const RISU_ARGS: RisuArgs = {
    [IS_LOGGED_IN]: RisuArgType.Int,
    [ACCESS_TOKEN]: RisuArgType.String,
    [ACCESS_TOKEN_EXPIRES]: RisuArgType.String,
    [REFRESH_TOKEN]: RisuArgType.String,
    [PROJECT_ID]: RisuArgType.String,
    [SERVICE_TIER]: RisuArgType.String,
    [OPT_OUT]: RisuArgType.Int,
    [MODEL_CONFIG]: RisuArgType.String,
    [CREDIT_OVERAGE]: RisuArgType.Int,
}


/**
 * 등록된 모든 Risu Arg 이름을 배열로 반환
 */
export function getAllArgNames(): string[] {
    return Object.keys(RISU_ARGS);
}
