export declare const runStatusEnum: import("drizzle-orm/pg-core").PgEnum<["PENDING", "RUNNING", "COMPLETED", "FAILED"]>;
export declare const actionTypeEnum: import("drizzle-orm/pg-core").PgEnum<["OPEN_BROWSER", "GOTO_URL", "SCREENSHOT", "CLICK", "SEND_KEYS", "SCROLL", "DOUBLE_CLICK", "FINISH", "ERROR"]>;
export declare const agentRuns: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "agent_runs";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "agent_runs";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        targetUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "target_url";
            tableName: "agent_runs";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "agent_runs";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: ["PENDING", "RUNNING", "COMPLETED", "FAILED"];
            baseColumn: never;
        }, {}, {}>;
        startedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "started_at";
            tableName: "agent_runs";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        completedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "completed_at";
            tableName: "agent_runs";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        errorLog: import("drizzle-orm/pg-core").PgColumn<{
            name: "error_log";
            tableName: "agent_runs";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        instructions: import("drizzle-orm/pg-core").PgColumn<{
            name: "instructions";
            tableName: "agent_runs";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const actionLogs: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "action_logs";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "action_logs";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        runId: import("drizzle-orm/pg-core").PgColumn<{
            name: "run_id";
            tableName: "action_logs";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        stepIndex: import("drizzle-orm/pg-core").PgColumn<{
            name: "step_index";
            tableName: "action_logs";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        actionType: import("drizzle-orm/pg-core").PgColumn<{
            name: "action_type";
            tableName: "action_logs";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "OPEN_BROWSER" | "GOTO_URL" | "SCREENSHOT" | "CLICK" | "SEND_KEYS" | "SCROLL" | "DOUBLE_CLICK" | "FINISH" | "ERROR";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: ["OPEN_BROWSER", "GOTO_URL", "SCREENSHOT", "CLICK", "SEND_KEYS", "SCROLL", "DOUBLE_CLICK", "FINISH", "ERROR"];
            baseColumn: never;
        }, {}, {}>;
        thought: import("drizzle-orm/pg-core").PgColumn<{
            name: "thought";
            tableName: "action_logs";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        parameters: import("drizzle-orm/pg-core").PgColumn<{
            name: "parameters";
            tableName: "action_logs";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        screenshotUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "screenshot_url";
            tableName: "action_logs";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "action_logs";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
