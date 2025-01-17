USE DATABASENAME
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER OFF
GO


-- =============================================
-- Author:		Ben Herriott
-- Create date: June 06, 2019
-- Description:	API JSON data to SQL TABLE
-- =============================================

ALTER PROCEDURE [dbo].[spAddEeseaJSON] (@json NVARCHAR(MAX))
AS 
BEGIN
	DECLARE @jsonTable TABLE (
		Vessel NVARCHAR(100) NOT NULL,
		Orig_DT datetime NOT NULL,
		Eesea_ETA datetime NOT NULL,
		Berth NVARCHAR(50),
		Voyage_Code NVARCHAR(50),
		ETA_Type NVARCHAR(50)
	); 
	INSERT INTO @jsonTable (
		Vessel, 
		Orig_DT, 
		Eesea_ETA, 
		Berth,
		Voyage_Code,
		ETA_Type
	)
	SELECT *
	FROM OPENJSON(@json)
	WITH (
		Vessel NVARCHAR(100) '$.vessel',
		Orig_DT datetime '$.originalDate',
		Eesea_ETA datetime '$.eeseaETA',
		Berth NVARCHAR(50) '$.berth',
		Voyage_Code NVARCHAR(50) '$.vCode',
		ETA_Type NVARCHAR(50) '$.etaType'
	)

	MERGE INTO TABLENAME WITH (HOLDLOCK) AS TARGET 
	
	USING (SELECT * FROM @jsonTable) AS SOURCE 
	ON (TARGET.Vessel = SOURCE.Vessel AND TARGET.Orig_DT = SOURCE.Orig_DT)

	WHEN MATCHED THEN UPDATE SET
		TARGET.Eesea_ETA    = CASE WHEN TARGET.ETA_Type != 'ARRIVED' AND SOURCE.ETA_Type = 'ARRIVED' AND SOURCE.Eesea_ETA BETWEEN DATEADD(hour, -2, TARGET.Eesea_ETA) 
								AND DATEADD(hour,2,TARGET.Eesea_ETA) THEN SOURCE.Eesea_ETA
								WHEN TARGET.Flag = 0 THEN SOURCE.Eesea_ETA ELSE TARGET.Eesea_ETA END, 
		TARGET.ETA_Type     = CASE WHEN TARGET.ETA_Type != 'ARRIVED' AND SOURCE.ETA_Type = 'ARRIVED' AND SOURCE.Eesea_ETA BETWEEN DATEADD(hour, -2, TARGET.Eesea_ETA) 
								AND DATEADD(hour,2,TARGET.Eesea_ETA) THEN SOURCE.ETA_Type
								WHEN TARGET.Flag = 1 THEN TARGET.ETA_Type
								WHEN SOURCE.ETA_Type = 'BERTH' THEN 'INBOUND (B)'
								WHEN SOURCE.ETA_Type = 'PILOT' THEN 'INBOUND (P)'
								ELSE SOURCE.ETA_Type END,
		TARGET.Berth        = CASE WHEN SOURCE.Berth IS NOT NULL THEN SOURCE.Berth ELSE TARGET.Berth END, 
		TARGET.Voyage_Code  = CASE WHEN SOURCE.Voyage_Code IS NOT NULL THEN SOURCE.Voyage_Code ELSE TARGET.Voyage_Code END, 
		TARGET.Flag         = CASE WHEN TARGET.Flag IS NULL THEN 0 ELSE TARGET.FLAG END
	WHEN NOT MATCHED BY TARGET 
		THEN INSERT (Vessel, Orig_DT, Eesea_ETA, Berth, Voyage_Code, ETA_Type) VALUES (SOURCE.Vessel, SOURCE.Orig_DT, SOURCE.Eesea_ETA, SOURCE.Berth, SOURCE.Voyage_Code, 
				CASE WHEN SOURCE.ETA_Type = 'BERTH' THEN 'INBOUND (B)' 
				WHEN SOURCE.ETA_Type = 'PILOT' THEN 'INBOUND (P)'
				ELSE SOURCE.ETA_Type END);
END





