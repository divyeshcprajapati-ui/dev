<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Traits\HasShopifyApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class B2BOrderingController extends Controller
{
    use HasShopifyApi;

    /**
     * Search Shopify product variants by SKU or title for Quick Order Pad & CSV Bulk Order.
     */
    public function lookupSkus(Request $request): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop') ?? $request->input('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $skus = $request->input('skus', []);
        $search = trim((string) ($request->query('q') ?? $request->input('q', '')));

        if (is_array($skus) && count($skus) > 0) {
            $results = [];
            foreach (array_slice($skus, 0, 100) as $entry) {
                $sku = trim((string) (is_array($entry) ? ($entry['sku'] ?? '') : $entry));
                $qty = is_array($entry) ? max(1, (int) ($entry['quantity'] ?? 1)) : 1;
                if ($sku === '') continue;

                $variant = $this->findVariantBySku($shop, $sku);
                if ($variant) {
                    $results[] = array_merge($variant, ['requested_sku' => $sku, 'quantity' => $qty, 'found' => true]);
                } else {
                    $results[] = ['requested_sku' => $sku, 'quantity' => $qty, 'found' => false, 'error' => 'SKU not found'];
                }
            }

            return response()->json(['success' => true, 'data' => $results]);
        }

        if ($search === '') {
            return response()->json(['success' => true, 'data' => []]);
        }

        $queryStr = str_replace('"', '', $search);
        $gql = '
        query searchVariants($query: String!) {
          productVariants(first: 15, query: $query) {
            edges {
              node {
                id
                sku
                title
                price
                inventoryQuantity
                image { url }
                product {
                  title
                  featuredImage { url }
                }
              }
            }
          }
        }';

        $res = $this->queryShopifyGraphQL($gql, ['query' => "sku:*{$queryStr}* OR title:*{$queryStr}*"], $shop);
        if (!$res['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to search catalog variants. Ensure read_products scope is granted.',
            ], 500);
        }

        $edges = $res['data']['productVariants']['edges'] ?? [];
        $items = array_map(fn($edge) => $this->formatVariantNode($edge['node']), $edges);

        return response()->json(['success' => true, 'data' => $items]);
    }

    private function findVariantBySku(string $shop, string $sku): ?array
    {
        $cleanSku = str_replace('"', '', $sku);
        $gql = '
        query variantBySku($query: String!) {
          productVariants(first: 1, query: $query) {
            edges {
              node {
                id
                sku
                title
                price
                inventoryQuantity
                image { url }
                product {
                  title
                  featuredImage { url }
                }
              }
            }
          }
        }';

        $res = $this->queryShopifyGraphQL($gql, ['query' => "sku:\"{$cleanSku}\""], $shop);
        if (!$res['success']) {
            return null;
        }

        $node = $res['data']['productVariants']['edges'][0]['node'] ?? null;
        return $node ? $this->formatVariantNode($node) : null;
    }

    private function formatVariantNode(array $node): array
    {
        $gid = (string) ($node['id'] ?? '');
        $numericId = preg_match('/\/(\d+)$/', $gid, $m) ? $m[1] : $gid;
        $productTitle = $node['product']['title'] ?? '';
        $variantTitle = ($node['title'] ?? '') !== 'Default Title' ? $node['title'] : '';

        return [
            'variant_gid' => $gid,
            'variant_id' => $numericId,
            'sku' => $node['sku'] ?? '',
            'product_title' => trim($productTitle . ($variantTitle ? " - {$variantTitle}" : '')),
            'price' => (float) ($node['price'] ?? 0),
            'inventory_quantity' => (int) ($node['inventoryQuantity'] ?? 0),
            'image_url' => $node['image']['url'] ?? ($node['product']['featuredImage']['url'] ?? null),
        ];
    }
}
